import re
from PyPDF2 import PdfReader


class ResumeParser:

    COMMON_SKILLS = [
        "python",
        "java",
        "c",
        "c++",
        "javascript",
        "html",
        "css",
        "react",
        "flask",
        "django",
        "sql",
        "mysql",
        "postgresql",
        "git",
        "github",
        "machine learning",
        "deep learning",
        "opencv",
        "mediapipe"
    ]

    @staticmethod
    def extract_text(file_path):

        try:

            print("\n========== PDF PARSER ==========")
            print("Opening PDF:", file_path)

            reader = PdfReader(file_path)

            print("Total Pages:", len(reader.pages))

            text = ""

            for index, page in enumerate(reader.pages):

                print(f"Reading Page {index + 1}")

                try:

                    page_text = page.extract_text()

                    if page_text:
                        text += page_text + "\n"

                except Exception as e:

                    print(f"Error reading page {index + 1}: {e}")

            print("PDF Text Extraction Completed")
            print("Characters Extracted:", len(text))
            print("================================\n")

            return text

        except Exception as e:

            print("PDF Parser Error:", str(e))

            return ""

    @staticmethod
    def extract_skills(text):

        try:

            if not text:
                return []

            text = text.lower()

            skills = []

            for skill in ResumeParser.COMMON_SKILLS:

                if skill.lower() in text:
                    skills.append(skill)

            print("Skills Found:", skills)

            return skills

        except Exception as e:

            print("Skill Extraction Error:", str(e))

            return []

    @staticmethod
    def extract_email(text):

        try:

            if not text:
                return ""

            match = re.search(
                r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
                text
            )

            if match:
                return match.group()

            return ""

        except Exception as e:

            print("Email Extraction Error:", str(e))
            return ""

    @staticmethod
    def extract_phone(text):

        try:

            if not text:
                return ""

            match = re.search(
                r"(\+91[- ]?)?[6-9]\d{9}",
                text
            )

            if match:
                return match.group()

            return ""

        except Exception as e:

            print("Phone Extraction Error:", str(e))
            return ""