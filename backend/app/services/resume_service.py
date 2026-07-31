import os
import uuid

from werkzeug.utils import secure_filename

from app.extensions import db
from app.models.resume_model import Resume
from app.utils.pdf_parser import ResumeParser


class ResumeService:

    ALLOWED_EXTENSIONS = {
        "pdf",
        "doc",
        "docx"
    }

    UPLOAD_FOLDER = "uploads/resumes"


    @staticmethod
    def allowed_file(filename):

        return (
            "." in filename
            and filename.rsplit(".", 1)[1].lower()
            in ResumeService.ALLOWED_EXTENSIONS
        )


    @staticmethod
    def upload_resume(file, candidate_id):

        try:

            print("\n========== RESUME SERVICE START ==========")


            # -----------------------------
            # File validation
            # -----------------------------

            if file is None:
                return {
                    "success": False,
                    "message": "No file selected."
                }, 400


            if file.filename == "":
                return {
                    "success": False,
                    "message": "Filename cannot be empty."
                }, 400


            if not ResumeService.allowed_file(file.filename):
                return {
                    "success": False,
                    "message": "Only PDF, DOC and DOCX files are allowed."
                }, 400



            # -----------------------------
            # Create upload folder
            # -----------------------------

            os.makedirs(
                ResumeService.UPLOAD_FOLDER,
                exist_ok=True
            )


            extension = file.filename.rsplit(".",1)[1].lower()


            unique_filename = (
                f"{uuid.uuid4()}.{extension}"
            )


            filepath = os.path.join(
                ResumeService.UPLOAD_FOLDER,
                unique_filename
            )


            # -----------------------------
            # Save file
            # -----------------------------

            file.save(filepath)

            print("STEP 1 : File saved")
            print("PATH :", filepath)
            return {
    "success": True,
    "message": "Test successful"
}, 200



            # -----------------------------
            # Extract text
            # -----------------------------

            try:

                print("STEP 2 : Extracting text")

                text = ResumeParser.extract_text(
                    filepath
                )

                if text is None:
                    text = ""

                print(
                    "Text length:",
                    len(text)
                )


            except Exception as e:

                print(
                    "PDF Extraction Error:",
                    str(e)
                )

                text = ""



            # -----------------------------
            # Extract skills
            # -----------------------------

            try:

                print("STEP 3 : Extracting skills")

                skills = ResumeParser.extract_skills(
                    text
                )

                if skills is None:
                    skills = []


            except Exception as e:

                print(
                    "Skill extraction error:",
                    str(e)
                )

                skills = []



            # -----------------------------
            # Extract contact details
            # -----------------------------

            try:

                print("STEP 4 : Extracting email")

                email = ResumeParser.extract_email(
                    text
                )

            except Exception:

                email = None



            try:

                print("STEP 5 : Extracting phone")

                phone = ResumeParser.extract_phone(
                    text
                )

            except Exception:

                phone = None



            # -----------------------------
            # Save database record
            # -----------------------------

            print("STEP 6 : Saving database")


            resume = Resume(

                candidate_id=candidate_id,

                file_name=secure_filename(
                    file.filename
                ),

                file_path=filepath,

                file_size=os.path.getsize(
                    filepath
                ),

                file_type=extension,

                extracted_text=text,

                extracted_skills=", ".join(skills),

                ai_summary=(
                    "Resume uploaded successfully."
                )

            )


            db.session.add(resume)

            db.session.commit()


            print("STEP 7 : Completed")
            print("==========================================\n")


            return {

                "success": True,

                "message": (
                    "Resume uploaded successfully."
                ),

                "resume": resume.to_dict(),

                "analysis": {

                    "email": email,

                    "phone": phone,

                    "skills": skills

                }

            }, 201



        except Exception as e:


            print(
                "RESUME SERVICE ERROR:",
                str(e)
            )


            db.session.rollback()


            return {

                "success": False,

                "message": (
                    "Resume upload failed."
                ),

                "error": str(e)

            }, 500



    @staticmethod
    def get_all_resumes(candidate_id):

        resumes = (
            Resume.query
            .filter_by(candidate_id=candidate_id)
            .order_by(
                Resume.created_at.desc()
            )
            .all()
        )


        return {

            "success": True,

            "count": len(resumes),

            "data": [

                resume.to_dict()

                for resume in resumes

            ]

        }



    @staticmethod
    def get_resume(resume_id, candidate_id):

        resume = Resume.query.filter_by(

            id=resume_id,

            candidate_id=candidate_id

        ).first()


        if resume is None:

            return {

                "success": False,

                "message": "Resume not found."

            },404



        return {

            "success": True,

            "resume": resume.to_dict()

        },200



    @staticmethod
    def delete_resume(resume_id, candidate_id):

        resume = Resume.query.filter_by(

            id=resume_id,

            candidate_id=candidate_id

        ).first()


        if resume is None:

            return {

                "success": False,

                "message": "Resume not found."

            },404



        if os.path.exists(
            resume.file_path
        ):

            os.remove(
                resume.file_path
            )


        db.session.delete(resume)

        db.session.commit()


        return {

            "success": True,

            "message": (
                "Resume deleted successfully."
            )

        },200