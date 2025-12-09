async function startScan() {
  const url = document.getElementById("url").value;
  const output = document.getElementById("output");

  output.textContent = "Scanne...";

  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });

  const data = await res.json();

  output.textContent = JSON.stringify(data, null, 2);
}