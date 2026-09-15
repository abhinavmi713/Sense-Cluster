from app.schemas import AnswerCreate, QuestionCreate


def test_question_normalizes_whitespace():
    assert QuestionCreate(text="  How   does  this work?  ").text == "How does this work?"


def test_question_rejects_blank_content():
    try:
        QuestionCreate(text="     ")
    except ValueError:
        return
    raise AssertionError("Expected blank question to fail validation")


def test_answer_strips_content():
    assert AnswerCreate(content="  This is a valid detailed answer.  ").content == "This is a valid detailed answer."
