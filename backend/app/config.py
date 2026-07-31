import os



class Config:


    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "smarthire-secret-key"
    )


    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "jwt-secret-key"
    )


    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///smarthire.db"
    )


    SQLALCHEMY_TRACK_MODIFICATIONS = False



    OPENAI_API_KEY = os.getenv(
        "OPENAI_API_KEY"
    )




class DevelopmentConfig(Config):

    DEBUG = True




class ProductionConfig(Config):

    DEBUG = False




config = {


    "development": DevelopmentConfig,


    "production": ProductionConfig,


    "default": DevelopmentConfig

}