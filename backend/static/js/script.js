document.getElementById("uploadForm").addEventListener("submit", async function (e) {

    e.preventDefault();

    const file = document.getElementById("resume").files[0];

    if (!file) {
        document.getElementById("status").textContent = "Please select a PDF file";
        return;
    }

    let formData = new FormData();
    formData.append("resume", file);

    try {
        let response = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        let data = await response.json();

        if (data.message) {

            document.getElementById("status").textContent = data.message;

            let details = data.data;

            document.getElementById("name").textContent = details.name;
            document.getElementById("email").textContent = details.email;
            document.getElementById("phone").textContent = details.phone;
            document.getElementById("education").textContent = details.education;
            document.getElementById("skills").textContent = details.skills.join(", ");
            document.getElementById("experience").textContent = details.experience;
            document.getElementById("projects").textContent = details.projects;
            document.getElementById("certifications").textContent = details.certifications;
            document.getElementById("languages").textContent = details.languages;

            setTimeout(() => {
                window.location.href = "/interview";
            }, 1500);

        } else {
            document.getElementById("status").textContent = data.error || "Upload failed";
        }

    } catch (error) {
        console.error(error);
        document.getElementById("status").textContent = error.message;
    }

});