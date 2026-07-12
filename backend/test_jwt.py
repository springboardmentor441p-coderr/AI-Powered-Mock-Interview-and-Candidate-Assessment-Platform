from security import create_access_token

token = create_access_token(
    {
        "sub": "varsha@gmail.com"
    }
)

print(token)