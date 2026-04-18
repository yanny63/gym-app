const input_username = document.querySelector("#username")
const input_email = document.querySelector("#email")
const input_password = document.querySelector("#password")
const length_t = document.querySelector("#length")
const special = document.querySelector("#special")
const number = document.querySelector("#number")
const r_button = document.querySelector(".register-submit")

function setValid(el, val) {
    el.classList.toggle('valid', val)
    el.classList.toggle('invalid', !val)
    el.querySelector(".icon").textContent = val ? "✔️" : "❌"
}

function validator() {
    let valid_username = input_username.value.length >= 4
    let valid_email = input_email.value.includes("@") && input_email.value.split("@").length === 2 && input_email.value.split("@")[0].length >= 1 && input_email.value.split("@")[1].includes(".") && input_email.value.split("@")[1].split(".")[1].length >= 1

    let enough_chars = input_password.value.length >= 8
    setValid(length_t, enough_chars)

    let enough_specials = /[!@#$%&]/.test(input_password.value)
    setValid(special, enough_specials)

    let enough_digits = /\d/.test(input_password.value) 
    setValid(number, enough_digits)
    if (valid_username && valid_email && enough_chars && enough_digits && enough_specials) {
        r_button.disabled = false 
    }
    else r_button.disabled = true
}


const parent_div = document.querySelector(".notifications")

function show_div(boolean, text) {
    const div = document.createElement("div")
    div.innerText = text
    parent_div.appendChild(div)
    div.classList.add(`notification-${boolean}`)
    div.addEventListener("click", div.remove)
    console.log(div)
    setTimeout(() => {
        let start = 0
        const duration = 500
        function fade_out(timestamp) {
            if (!start) start = timestamp
            const elapsed = timestamp - start
            const progress = elapsed / duration
            const ease = 1 - Math.pow(1 - progress, 3)
            if (progress > 1) {
                div.remove()
                return
            }
            div.style.opacity = 1 - ease
            requestAnimationFrame(fade_out)
        }
        requestAnimationFrame(fade_out)
    }, 3000);
}

function turn_red(input) {
    let which 
    if (input === 'username') which = input_username
    else if (input === 'email') which = input_email
    else if (input === 'password') which = input_password
    
    which.style.borderColor = '#ef4444'
    which.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.1)'
}

async function send() {
    try {
        const res = await fetch("/register", {
            method: "POST",
            headers: {"Content-Type": "application/json"}, 
            body: JSON.stringify({
                "username": input_username.value,
                "email": input_email.value,
                "password": input_password.value,
                "language": localStorage.getItem('lang') || navigator.language.split("-")[0]
            })
        })
        if (!res.ok) {
            throw new Error(res.status);
        }
        const data = await res.json()
        console.log(data)
        if (data.error) {
            show_div(false, data.error)
            turn_red(data.input)
            throw new Error(data.error)
        }
        let text
        if (localStorage.getItem('lang') == 'pl' || navigator.language.split("-")[0] == 'pl') text = 'Pomyślnie założono konto.'
        else if (localStorage.getItem('lang') == 'en' || navigator.language.split("-")[0] == 'en') text = 'Account created successfully.'
        else if (localStorage.getItem('lang') == 'es' || navigator.language.split("-")[0] == 'es') text = 'Cuenta creada con éxito.'
        show_div(data.success, text)
        setTimeout(() => {
            window.location.href = "/"
        }, 1000);
    }
    catch (err) {
        console.log(err)
    }
}

input_username.addEventListener("input", validator)
input_email.addEventListener("input", validator)
input_password.addEventListener("input", validator)
r_button.addEventListener('click', send)