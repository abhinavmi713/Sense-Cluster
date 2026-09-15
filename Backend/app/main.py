import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.config import get_settings
from app.db import Base, SessionLocal, engine, get_db
from app.embedding import encode, get_embedding_model
from app.models import (
    Answer,
    ContributorRequest,
    ContributorRequestStatus,
    Question,
    QuestionStatus,
    Role,
    User,
)
from app.schemas import (
    AnswerCreate,
    ContributorRequestCreate,
    ContributorRequestResponse,
    ContributorRequestReview,
    ContributorRequestWithUserResponse,
    Page,
    QuestionCreate,
    QuestionCreateResult,
    QuestionResponse,
    RegisterRequest,
    RoleUpdate,
    SimilarQuestion,
    TokenResponse,
    UserResponse,
)
from app.rate_limit import enforce_auth_rate_limit
from app.security import (
    create_access_token,
    get_current_user,
    hash_password,
    require_roles,
    verify_password,
)


settings = get_settings()
logger = logging.getLogger("sensecluster")


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.database_url.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)

    get_embedding_model()

    if (
        settings.bootstrap_admin_email
        and settings.bootstrap_admin_password
    ):
        with SessionLocal() as db:
            email = settings.bootstrap_admin_email.lower()

            existing_admin = db.scalar(
                select(User).where(User.email == email)
            )

            if existing_admin is None:
                db.add(
                    User(
                        email=email,
                        password_hash=hash_password(
                            settings.bootstrap_admin_password.get_secret_value()
                        ),
                        role=Role.admin,
                    )
                )

                db.commit()

                logger.warning(
                    "Bootstrap administrator was created; "
                    "remove BOOTSTRAP_ADMIN_PASSWORD after first start"
                )

    yield


app = FastAPI(
    title="Sense-Cluster API",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_middleware(
    request: Request,
    call_next,
):
    request_id = request.headers.get(
        "X-Request-ID",
        str(uuid.uuid4()),
    )

    response = await call_next(request)

    response.headers["X-Request-ID"] = request_id

    return response


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    _: Request,
    exc: RequestValidationError,
):
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "details": exc.errors(),
            }
        },
    )


# -------------------------------------------------------------------
# Health
# -------------------------------------------------------------------

@app.get("/health")
def health(
    db: Session = Depends(get_db),
):
    db.execute(select(1))

    return {
        "status": "ok",
        "embedding_model": settings.embedding_model,
    }


# -------------------------------------------------------------------
# Authentication
# -------------------------------------------------------------------

@app.post(
    "/api/v1/auth/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(enforce_auth_rate_limit)],
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    email = data.email.lower()

    if db.scalar(
        select(User).where(User.email == email)
    ):
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    # New users are always Members.
    # They can later request Contributor access.
    user = User(
        email=email,
        password_hash=hash_password(data.password),
        role=Role.member,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(user),
    )


@app.post(
    "/api/v1/auth/token",
    response_model=TokenResponse,
    dependencies=[Depends(enforce_auth_rate_limit)],
)
def token(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User).where(
            User.email == data.email.lower()
        )
    )

    if user is None or not verify_password(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    return TokenResponse(
        access_token=create_access_token(user),
    )


@app.get(
    "/api/v1/auth/me",
    response_model=UserResponse,
)
def get_me(
    user: User = Depends(get_current_user),
):
    return UserResponse.model_validate(user)


# -------------------------------------------------------------------
# Contributor Requests
# -------------------------------------------------------------------

@app.post(
    "/api/v1/contributor-requests",
    response_model=ContributorRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_contributor_request(
    data: ContributorRequestCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role == Role.admin:
        raise HTTPException(
            status_code=400,
            detail="Admins already have contributor permissions",
        )

    if user.role == Role.contributor:
        raise HTTPException(
            status_code=400,
            detail="You are already a contributor",
        )

    existing_pending = db.scalar(
        select(ContributorRequest).where(
            ContributorRequest.user_id == user.id,
            ContributorRequest.status
            == ContributorRequestStatus.pending,
        )
    )

    if existing_pending:
        raise HTTPException(
            status_code=409,
            detail="You already have a pending contributor request",
        )

    request = ContributorRequest(
        user_id=user.id,
        reason=data.reason,
        status=ContributorRequestStatus.pending,
    )

    db.add(request)
    db.commit()
    db.refresh(request)

    return ContributorRequestResponse.model_validate(
        request
    )


@app.get(
    "/api/v1/contributor-requests/me",
    response_model=ContributorRequestResponse | None,
)
def get_my_contributor_request(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    request = db.scalar(
        select(ContributorRequest)
        .where(
            ContributorRequest.user_id == user.id
        )
        .order_by(
            ContributorRequest.created_at.desc()
        )
    )

    if request is None:
        return None

    return ContributorRequestResponse.model_validate(
        request
    )


@app.get(
    "/api/v1/admin/contributor-requests",
    response_model=list[
        ContributorRequestWithUserResponse
    ],
)
def list_contributor_requests(
    db: Session = Depends(get_db),
    _: User = Depends(
        require_roles(Role.admin)
    ),
):
    requests = db.scalars(
        select(ContributorRequest)
        .options(
            joinedload(
                ContributorRequest.user
            )
        )
        .order_by(
            ContributorRequest.created_at.desc()
        )
    ).unique().all()

    return [
        ContributorRequestWithUserResponse(
            id=request.id,
            user_id=request.user_id,
            user_email=request.user.email,
            status=request.status.value,
            reason=request.reason,
            created_at=request.created_at,
            reviewed_at=request.reviewed_at,
            reviewed_by_id=request.reviewed_by_id,
        )
        for request in requests
    ]


@app.put(
    "/api/v1/admin/contributor-requests/{request_id}",
    response_model=ContributorRequestWithUserResponse,
)
def review_contributor_request(
    request_id: uuid.UUID,
    data: ContributorRequestReview,
    db: Session = Depends(get_db),
    admin: User = Depends(
        require_roles(Role.admin)
    ),
):
    contributor_request = db.scalar(
        select(ContributorRequest)
        .options(
            joinedload(
                ContributorRequest.user
            )
        )
        .where(
            ContributorRequest.id == request_id
        )
    )

    if contributor_request is None:
        raise HTTPException(
            status_code=404,
            detail="Contributor request not found",
        )

    if (
        contributor_request.status
        != ContributorRequestStatus.pending
    ):
        raise HTTPException(
            status_code=409,
            detail="This contributor request has already been reviewed",
        )

    new_status = ContributorRequestStatus(
        data.status
    )

    contributor_request.status = new_status
    contributor_request.reviewed_at = (
        datetime.now(timezone.utc)
    )
    contributor_request.reviewed_by_id = admin.id

    if (
        new_status
        == ContributorRequestStatus.approved
    ):
        contributor_request.user.role = (
            Role.contributor
        )

    db.commit()
    db.refresh(contributor_request)

    return ContributorRequestWithUserResponse(
        id=contributor_request.id,
        user_id=contributor_request.user_id,
        user_email=contributor_request.user.email,
        status=contributor_request.status.value,
        reason=contributor_request.reason,
        created_at=contributor_request.created_at,
        reviewed_at=contributor_request.reviewed_at,
        reviewed_by_id=contributor_request.reviewed_by_id,
    )


# -------------------------------------------------------------------
# User Management
# -------------------------------------------------------------------

@app.put(
    "/api/v1/users/{user_id}/role",
    response_model=UserResponse,
)
def update_user_role(
    user_id: uuid.UUID,
    data: RoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(
        require_roles(Role.admin)
    ),
):
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # Prevent an admin from accidentally removing
    # their own administrator permissions.
    if (
        user.id == admin.id
        and data.role != "admin"
    ):
        raise HTTPException(
            status_code=400,
            detail="You cannot remove your own admin role",
        )

    user.role = Role(data.role)

    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)


@app.get(
    "/api/v1/admin/users",
    response_model=list[UserResponse],
)
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(
        require_roles(Role.admin)
    ),
):
    users = db.scalars(
        select(User).order_by(
            User.created_at.desc()
        )
    ).all()

    return [
        UserResponse.model_validate(user)
        for user in users
    ]


# -------------------------------------------------------------------
# Questions
# -------------------------------------------------------------------

@app.post(
    "/api/v1/questions",
    response_model=QuestionCreateResult,
    status_code=status.HTTP_201_CREATED,
)
def create_question(
    data: QuestionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    normalized_text = data.text.casefold()

    exact = db.scalar(
        select(Question)
        .options(
            joinedload(Question.answer)
        )
        .where(
            Question.normalized_text
            == normalized_text
        )
    )

    if exact:
        return QuestionCreateResult(
            outcome=(
                "duplicate_answered"
                if exact.answer
                else "duplicate_unanswered"
            ),
            match=SimilarQuestion(
                question=QuestionResponse.model_validate(
                    exact
                ),
                similarity=1.0,
            ),
        )

    embedding = encode(data.text)

    if settings.database_url.startswith(
        "sqlite"
    ):
        candidates = db.scalars(
            select(Question)
            .options(
                joinedload(Question.answer)
            )
        ).unique().all()

        nearest = max(
            candidates,
            key=lambda candidate: sum(
                a * b
                for a, b in zip(
                    candidate.embedding,
                    embedding,
                )
            ),
            default=None,
        )

        similarity = (
            sum(
                a * b
                for a, b in zip(
                    nearest.embedding,
                    embedding,
                )
            )
            if nearest
            else None
        )

    else:
        distance = (
            Question.embedding
            .cosine_distance(embedding)
            .label("distance")
        )

        row = db.execute(
            select(
                Question,
                distance,
            )
            .options(
                joinedload(Question.answer)
            )
            .order_by(distance)
            .limit(1)
        ).first()

        nearest = (
            row[0]
            if row
            else None
        )

        similarity = (
            1 - float(row[1])
            if row
            else None
        )

    if (
        nearest
        and similarity is not None
    ):
        candidate = nearest

        if (
            similarity
            >= settings.similarity_threshold
        ):
            return QuestionCreateResult(
                outcome=(
                    "duplicate_answered"
                    if candidate.answer
                    else "duplicate_unanswered"
                ),
                match=SimilarQuestion(
                    question=QuestionResponse.model_validate(
                        candidate
                    ),
                    similarity=similarity,
                ),
            )

    question = Question(
        text=data.text,
        normalized_text=normalized_text,
        author_id=user.id,
        embedding=embedding,
        embedding_model=settings.embedding_model,
    )

    db.add(question)

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="A matching question was just created",
        ) from None

    db.refresh(question)

    return QuestionCreateResult(
        outcome="new_question",
        question=QuestionResponse.model_validate(
            question
        ),
    )


@app.get(
    "/api/v1/questions",
    response_model=Page,
)
def list_questions(
    offset: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if (
        offset < 0
        or not 1 <= limit <= 100
    ):
        raise HTTPException(
            status_code=422,
            detail="offset must be >= 0 and limit must be 1..100",
        )

    query = (
        select(Question)
        .options(
            joinedload(Question.answer)
        )
        .order_by(
            Question.created_at.desc()
        )
    )

    total = (
        db.scalar(
            select(func.count())
            .select_from(Question)
        )
        or 0
    )

    items = db.scalars(
        query
        .offset(offset)
        .limit(limit)
    ).unique().all()

    return Page(
        items=[
            QuestionResponse.model_validate(
                item
            )
            for item in items
        ],
        total=total,
        offset=offset,
        limit=limit,
    )


# -------------------------------------------------------------------
# My Questions
# -------------------------------------------------------------------

@app.get(
    "/api/v1/questions/mine",
    response_model=Page,
)
def list_my_questions(
    offset: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if (
        offset < 0
        or not 1 <= limit <= 100
    ):
        raise HTTPException(
            status_code=422,
            detail="offset must be >= 0 and limit must be 1..100",
        )

    query = (
        select(Question)
        .options(
            joinedload(Question.answer)
        )
        .where(
            Question.author_id == user.id
        )
        .order_by(
            Question.created_at.desc()
        )
    )

    total = (
        db.scalar(
            select(func.count())
            .select_from(Question)
            .where(
                Question.author_id == user.id
            )
        )
        or 0
    )

    items = db.scalars(
        query
        .offset(offset)
        .limit(limit)
    ).unique().all()

    return Page(
        items=[
            QuestionResponse.model_validate(
                item
            )
            for item in items
        ],
        total=total,
        offset=offset,
        limit=limit,
    )


# -------------------------------------------------------------------
# Answers
# -------------------------------------------------------------------

@app.post(
    "/api/v1/questions/{question_id}/answer",
    response_model=QuestionResponse,
)
def submit_answer(
    question_id: uuid.UUID,
    data: AnswerCreate,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_roles(
            Role.contributor,
            Role.admin,
        )
    ),
):
    question = db.scalar(
        select(Question)
        .options(
            joinedload(Question.answer)
        )
        .where(
            Question.id == question_id
        )
    )

    if question is None:
        raise HTTPException(
            status_code=404,
            detail="Question not found",
        )

    if question.answer is not None:
        raise HTTPException(
            status_code=409,
            detail="Question already has an answer",
        )

    question.answer = Answer(
        content=data.content,
        author_id=user.id,
    )

    question.status = (
        QuestionStatus.answered
    )

    db.commit()
    db.refresh(question)

    return QuestionResponse.model_validate(
        question
    )


@app.put(
    "/api/v1/questions/{question_id}/answer",
    response_model=QuestionResponse,
)
def update_answer(
    question_id: uuid.UUID,
    data: AnswerCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    question = db.scalar(
        select(Question)
        .options(
            joinedload(Question.answer)
        )
        .where(
            Question.id == question_id
        )
    )

    if (
        question is None
        or question.answer is None
    ):
        raise HTTPException(
            status_code=404,
            detail="Answer not found",
        )

    if (
        user.role != Role.admin
        and question.answer.author_id
        != user.id
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Only the answer author or an admin "
                "may edit this answer"
            ),
        )

    question.answer.content = data.content
    question.version += 1

    db.commit()
    db.refresh(question)

    return QuestionResponse.model_validate(
        question
    )