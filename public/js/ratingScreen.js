getDog()

async function getDog() {
    let url = " https://dog.ceo/api/breeds/image/random";
    let response = await fetch(url);
    let data = await response.json();
    console.log(data);
    document.querySelector("#dogImage").innerHTML = `<img src="${data.message}">`;
}