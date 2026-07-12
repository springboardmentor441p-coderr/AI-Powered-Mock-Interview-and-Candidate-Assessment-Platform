QUESTION_BANK = {

    "Python": [
        "What are Python decorators?",
        "Explain list and tuple.",
        "What is OOP in Python?"
    ],

    "Java": [
        "Explain JVM.",
        "Difference between JDK and JRE.",
        "What is inheritance?"
    ],

    "SQL": [
        "What is a JOIN?",
        "Difference between WHERE and HAVING?",
        "Explain normalization."
    ],

    "HTML": [
        "What is Semantic HTML?",
        "Difference between div and span?"
    ],

    "CSS": [
        "What is Flexbox?",
        "Difference between Grid and Flex?"
    ],

    "Machine Learning": [
        "What is overfitting?",
        "Difference between supervised and unsupervised learning?",
        "Explain gradient descent."
    ],

    "Git": [
        "What is Git?",
        "Difference between git pull and git fetch?"
    ]
}


def generate_questions(skills):

    questions = {}

    for skill in skills:
        if skill in QUESTION_BANK:
            questions[skill] = QUESTION_BANK[skill]

    return questions