const user = document.querySelector("#user")
const password = document.querySelector("#password")
const login_button = document.querySelector(".login-send")


function turn_red(input) {
    let which 
    if (input === 'user') which = user
    
    which.style.borderColor = '#ef4444'
    which.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.1)'
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

function validate() {
    let valid_user = user.value.length >= 4
    let valid_password = password.value.length >= 6
    if (valid_password && valid_user) login_button.disabled = false
    else login_button.disabled = true
}

async function send_data() {
    try {
        const res = await fetch("/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                user: user,
                password: password,
                language: localStorage.getItem('lang') || navigator.language.split("-")[0]
            })
        })
        if (!res.ok) {
            throw new Error(res.status)
        }
        const data = await res.json()
        if (data.error) {
            turn_red(data.input)
            show_div(false, data.error)
            throw new Error(data.error)
        }
        let text
        if (localStorage.getItem('lang') == 'pl' || navigator.language.split("-")[0] == 'pl') text = 'Pomyślnie się zalogowano.'
        else if (localStorage.getItem('lang') == 'en' || navigator.language.split("-")[0] == 'en') text = 'Logged in successfully.'
        else if (localStorage.getItem('lang') == 'es' || navigator.language.split("-")[0] == 'es') text = 'Sesión iniciada con éxito.'
        show_div(data.success, text)
        window.location.href = "/"
    }
    catch (err) {
        console.log(`Error - ${err}`)
    }
}

user.addEventListener("input", validate)
password.addEventListener("input", validate)
login_button.addEventListener("click", send_data)