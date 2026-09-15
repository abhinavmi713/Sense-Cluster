import app.main as main_module


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_create_question_returns_new_question(client, register_user):
    _email, _password, token = register_user()

    response = client.post(
        "/api/v1/questions",
        json={"text": "Why does the sky appear blue during the day?"},
        headers=auth_headers(token),
    )

    assert response.status_code == 201
    body = response.json()
    assert body["outcome"] == "new_question"
    assert body["question"]["status"] == "open"


def test_exact_duplicate_text_is_detected_without_embedding_similarity(
    client, register_user
):
    _email, _password, token = register_user()

    text = "Exact duplicate detection question text."

    first = client.post(
        "/api/v1/questions",
        json={"text": text},
        headers=auth_headers(token),
    )
    assert first.json()["outcome"] == "new_question"

    # Different casing/whitespace still normalizes to the same text.
    second = client.post(
        "/api/v1/questions",
        json={"text": "  EXACT   duplicate DETECTION question TEXT.  "},
        headers=auth_headers(token),
    )

    assert second.status_code == 201
    body = second.json()
    assert body["outcome"] == "duplicate_unanswered"
    assert body["match"]["similarity"] == 1.0


def test_semantic_duplicate_above_threshold_is_detected(
    client, register_user, monkeypatch
):
    """Two different texts whose embeddings are near-identical should be
    flagged as a duplicate via the SQLite cosine-similarity fallback path,
    independent of the real embedding model's output."""

    _email, _password, token = register_user()

    vectors = iter(
        [
            [1.0, 0.0, 0.0],
            [0.99, 0.14, 0.0],  # cosine similarity ~0.99 with the first vector
        ]
    )
    monkeypatch.setattr(main_module, "encode", lambda _text: next(vectors))

    first = client.post(
        "/api/v1/questions",
        json={"text": "How do I configure the semantic search index?"},
        headers=auth_headers(token),
    )
    assert first.json()["outcome"] == "new_question"

    second = client.post(
        "/api/v1/questions",
        json={"text": "What is the process for setting up semantic search?"},
        headers=auth_headers(token),
    )

    assert second.status_code == 201
    assert second.json()["outcome"] == "duplicate_unanswered"


def test_semantic_similarity_below_threshold_creates_new_question(
    client, register_user, monkeypatch
):
    _email, _password, token = register_user()

    vectors = iter(
        [
            [1.0, 0.0, 0.0],
            [0.0, 1.0, 0.0],  # orthogonal vectors: similarity 0.0
        ]
    )
    monkeypatch.setattr(main_module, "encode", lambda _text: next(vectors))

    first = client.post(
        "/api/v1/questions",
        json={"text": "Completely unrelated first question here."},
        headers=auth_headers(token),
    )
    assert first.json()["outcome"] == "new_question"

    second = client.post(
        "/api/v1/questions",
        json={"text": "Something entirely different from the first one."},
        headers=auth_headers(token),
    )

    assert second.status_code == 201
    assert second.json()["outcome"] == "new_question"


def test_list_questions_rejects_invalid_pagination(client, register_user):
    _email, _password, token = register_user()

    response = client.get(
        "/api/v1/questions?offset=-1",
        headers=auth_headers(token),
    )

    assert response.status_code == 422


def test_my_questions_only_returns_own_questions(client, register_user):
    _email_a, _password_a, token_a = register_user()
    _email_b, _password_b, token_b = register_user()

    client.post(
        "/api/v1/questions",
        json={"text": "Question created by user A for filtering test."},
        headers=auth_headers(token_a),
    )

    response = client.get(
        "/api/v1/questions/mine",
        headers=auth_headers(token_b),
    )

    assert response.status_code == 200
    assert response.json()["items"] == []
