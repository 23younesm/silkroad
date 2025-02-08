document.addEventListener("DOMContentLoaded", () => {
    fetch('/products?query=gold')
        .then(response => response.text())
        .then(data => {
            document.getElementById('product-list').innerHTML = data;
        });
});
