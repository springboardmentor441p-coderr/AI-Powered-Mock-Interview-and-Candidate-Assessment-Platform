import unittest

from backend.services.candidate import extract_candidate_name


class CandidateServiceTests(unittest.TestCase):
    def test_extracts_name_from_email(self):
        self.assertEqual(extract_candidate_name("maria.fernandez@example.com"), "Maria Fernandez")

    def test_falls_back_to_local_part_when_email_has_no_name(self):
        self.assertEqual(extract_candidate_name("candidate123@example.com"), "candidate123")


if __name__ == "__main__":
    unittest.main()
