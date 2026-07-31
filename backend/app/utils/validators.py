import re



def validate_email(email):

    pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"

    return re.match(
        pattern,
        email
    )



def validate_password(password):

    if len(password) < 6:

        return False


    return True