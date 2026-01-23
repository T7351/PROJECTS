/* ------------------------ FILE_SIZE_CHECKER ------------------------ */
const inputFile = document.getElementById("uploadInput");
inputFile.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        alert("File too large! Max allowed size is 2MB.");
        this.value = "";
        return;
    }

    const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (!validTypes.includes(file.type)) {
        alert("Only PDF or DOCX files are allowed!");
        this.value = "";
        return;
    }

    handleFileUpload(file);
});


/* ------------------------ PDF_DOCX_TEXT_EXTRACTOR ------------------------ */
function handleFileUpload(file){
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "pdf") extractpdf(file);
    else extractdocx(file);
}

async function extractpdf(file) {
    const reader = new FileReader();

    reader.onload = async function () {
        const typedArray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;

        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(" ");
            text += pageText + "\n\n";
        }

        document.getElementById("userInput").value = text;
        callLLM();   // Trigger ATS
    };

    reader.readAsArrayBuffer(file);
}

async function extractdocx(file) {
    const reader = new FileReader();

    reader.onload = async function (e) {
        const zip = await JSZip.loadAsync(e.target.result);
        const doc = await zip.file("word/document.xml").async("string");

        let extracted = doc.replace(/<[^>]+>/g, " ");
        extracted = extracted.replace(/\s+/g, " ").trim();

        document.getElementById("userInput").value = extracted;
        callLLM();  // Trigger ATS
    };

    reader.readAsArrayBuffer(file);
}


/* ------------------------ ATS_BY_GEMINI ------------------------ */
async function callLLM() {

    const apiKey = "AIzaSyBXAR-VwvN231j0nMuubW3t1lsveV2fWbw";  // <-- REQUIRED

    const resume = document.getElementById("userInput").value.trim();

    if (!resume) {
        alert("Resume extraction failed.");
        return;
    }

    // LOADING UI (replace upload text with loader)
    document.querySelector(".upload_main").innerHTML = "<h3>Analyzing resume... Please wait</h3>";

    const prompt = `
    You are an ATS evaluator.
    IMPORTANT:
    Return ONLY valid JSON. 
    NO explanation.
    NO extra text.
    NO markdown.
    NO backticks.
    JSON FORMAT:
    {
        "atsScore": 75,
        "pointers": [
        { "point": "Add measurable achievements" },
        { "point": "Improve technical skills" }
        ]
    }
    Now generate the JSON only.
    Resume:${resume}
    `;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        const data = await response.json();
        const output = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        let atsJson;
        try {
            atsJson = JSON.parse(output);
        } catch (e) {
            alert("API returned invalid JSON. Try again.");
            return;
        }

        // Hide upload box
        document.querySelector(".upload").style.display = "none";

        // Show ATS card
        const card = document.getElementById("atsResultCard");
        card.style.display = "block";

        // Update score circle
        const score = atsJson.atsScore;
        const circle = document.getElementById("atsScoreCircle");
        circle.querySelector("span").textContent = score + "%";
        circle.style.setProperty("--score", (score / 100) * 360 + "deg");

        // Update suggestions list
        const list = document.getElementById("atsSuggestions");
        list.innerHTML = "";
        atsJson.pointers.forEach(obj => {
            let li = document.createElement("li");
            li.textContent = obj.point;
            list.appendChild(li);
        });

    } catch (err) {
        alert("Error: " + err.message);
    }
}
