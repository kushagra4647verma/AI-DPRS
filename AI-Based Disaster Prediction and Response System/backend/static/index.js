document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("sendbutton").addEventListener('click', (event) => {
    event.preventDefault();
    
    const link = document.getElementById("link");
    const input = document.getElementById("imageinput");
    
    if (input.files && input.files[0]) {
      let formData = new FormData();
      formData.append("video", input.files[0]);
      
      fetch("/detect", {
        method: "POST",
        body: formData,
        cache: "no-cache",
        headers: {
          'Accept': 'application/json'
        },
      })
      .then(response => response.json())
      .then(data => {
        if (data.output_path) {
          link.setAttribute('href', data.output_path);
          link.style.visibility = "visible";
          document.querySelector(".download").disabled = false;
        }
      })
      .catch(error => {
        console.error("upload error", error);
      });
    }
  });
});


