def evaluate_interview(answers):

    score = 0
    technical_score = 0
    communication_score = 0


    total_questions = len(answers)



    if total_questions == 0:

        return {

            "score": 0,

            "technical_score": 0,

            "communication_score": 0,

            "feedback": "No answers provided"

        }



    technical_keywords = [

        "python",
        "java",
        "sql",
        "machine learning",
        "flask",
        "react",
        "database",
        "api",
        "algorithm",
        "project"

    ]



    total_length = 0

    keyword_count = 0



    for item in answers:


        answer = item.get("answer", "").lower()


        total_length += len(answer)



        for keyword in technical_keywords:

            if keyword in answer:

                keyword_count += 1




    # Technical score

    technical_score = min(
        100,
        keyword_count * 10
    )



    # Communication score

    average_length = total_length / total_questions


    if average_length > 100:

        communication_score = 90

    elif average_length > 50:

        communication_score = 75

    else:

        communication_score = 50




    # Final score

    score = int(

        (technical_score * 0.6)
        +
        (communication_score * 0.4)

    )



    feedback = ""


    if score >= 80:

        feedback = (
            "Excellent interview performance. "
            "Good technical understanding and clear explanations."
        )


    elif score >= 60:

        feedback = (
            "Good performance. "
            "Try adding more technical details and examples."
        )


    else:

        feedback = (
            "Need improvement. "
            "Provide more detailed answers with project examples."
        )



    return {

        "score": score,

        "technical_score": technical_score,

        "communication_score": communication_score,

        "feedback": feedback

    }