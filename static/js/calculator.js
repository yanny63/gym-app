const input_age = document.querySelector("#age")
const age_span = document.querySelector("#current-age")

input_age.addEventListener("input", () => {
    age_span.innerText = input_age.value
})