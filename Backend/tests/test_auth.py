from app.models import Role


def test_health_check(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_register_and_me(client, register_user):
    email, _password, token = register_user()

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == email
    assert body["role"] == "member"


def test_register_duplicate_email_is_rejected(client, register_user):
    email, password, _token = register_user()

    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )

    assert response.status_code == 409


def test_login_with_wrong_password_is_rejected(client, register_user):
    email, _password, _token = register_user()

    response = client.post(
        "/api/v1/auth/token",
        json={"email": email, "password": "totally-wrong-password"},
    )

    assert response.status_code == 401


def test_login_with_correct_password_succeeds(client, register_user):
    email, password, _token = register_user()

    response = client.post(
        "/api/v1/auth/token",
        json={"email": email, "password": password},
    )

    assert response.status_code == 200
    assert "access_token" in response.json()


def test_missing_token_is_rejected(client):
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_member_cannot_submit_answer(client, register_user):
    _email, _password, token = register_user()

    question = client.post(
        "/api/v1/questions",
        json={"text": "How do I reset my password please?"},
        headers={"Authorization": f"Bearer {token}"},
    ).json()["question"]

    response = client.post(
        f"/api/v1/questions/{question['id']}/answer",
        json={"content": "This is a perfectly valid answer."},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_contributor_can_submit_answer(client, register_user, make_user_with_role):
    _email, _password, member_token = register_user()

    question = client.post(
        "/api/v1/questions",
        json={"text": "What is the capital of a fictional test country?"},
        headers={"Authorization": f"Bearer {member_token}"},
    ).json()["question"]

    _contributor_id, _contributor_email, contributor_token = make_user_with_role(
        Role.contributor
    )

    response = client.post(
        f"/api/v1/questions/{question['id']}/answer",
        json={"content": "This is a perfectly valid contributor answer."},
        headers={"Authorization": f"Bearer {contributor_token}"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "answered"


def test_non_admin_cannot_list_users(client, register_user):
    _email, _password, token = register_user()

    response = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_admin_can_update_user_role(client, register_user, make_user_with_role):
    target_email, _password, target_token = register_user()
    _admin_id, _admin_email, admin_token = make_user_with_role(Role.admin)

    me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {target_token}"},
    ).json()

    response = client.put(
        f"/api/v1/users/{me['id']}/role",
        json={"role": "contributor"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    assert response.json()["role"] == "contributor"
    assert response.json()["email"] == target_email


def test_admin_cannot_remove_own_admin_role(client, make_user_with_role):
    admin_id, _admin_email, admin_token = make_user_with_role(Role.admin)

    response = client.put(
        f"/api/v1/users/{admin_id}/role",
        json={"role": "member"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 400
