function show_results(x, typ, results) {
    x.classList.add("not-visible")
    const lang = localStorage.getItem('lang') || navigator.language().split("-")[0]
    let header
    
    if (typ === 'one_rep') {
        if (lang === 'pl') {
            header = "Twój szacowany 1RM wynosi:"
        }
        else if (lang === 'es') {
            header = "Tu 1RM estimado es:"
        }
        else {
            header = 'Your 1RM is estimated to be:'
        } 
        document.querySelector("#results-display").innerText = results + 'kg'
    }
    else if (typ === 'calories') {
        if (lang === 'pl') {
            header = "Twoje szacowane zapotrzebowanie to:"
        }
        else if (lang === 'es') {
            header = "Tu ingesta calórica estimada es:"
        }
        else {
            header = 'Your caloric intake is estimated to be:'
        } 
        document.querySelector("#results-display").innerText = results + 'kcal'
    }
    const div = document.querySelector(".results")
    div.classList.remove("not-visible")
    const h = document.querySelector(".results h1")
    h.innerText = header
    
}


const input_age = document.querySelector("#age")
const age_span = document.querySelector("#current-age")

input_age.addEventListener("input", () => {
    age_span.innerText = input_age.value
})

const init_header = document.querySelector(".init_header")
const one_rep = document.querySelector(".one_rep")
const calories = document.querySelector(".calories")

const onerep_button = document.querySelector("#onerep")
onerep_button.addEventListener("click", (a) => {
    a.preventDefault()
    init_header.classList.add("not-visible-buttons")
    one_rep.classList.remove("not-visible")
})

const calories_buttton = document.querySelector("#calories")
calories_buttton.addEventListener("click", (a) => {
    a.preventDefault()
    init_header.classList.add("not-visible-buttons")
    calories.classList.remove("not-visible")
})

document.querySelectorAll(".exit").forEach(button => {
    button.addEventListener('click', () => {
        const div = button.closest('div')
        div.classList.add('not-visible')
        init_header.classList.remove('not-visible-buttons')
    })
})

document.querySelector("#one_rep-button").addEventListener("click", async function () {
    const weight = document.querySelector("#weight")
    const reps = document.querySelector("#reps")
    if (!weight.value || weight.value === '' || !reps.value || reps.value === '') return
    try {
        const res = await fetch(`/API/calculator`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                type: 'one-rep',
                weight: weight.value,
                reps: reps.value
            })
        })
        if (!res.ok) {
            throw new Error(res.status)
        }
        const data = await res.json()
        console.log(data)
        const results = data.result
        console.log(results)
        show_results(one_rep, 'one_rep', results)
    }
    catch (err) {
        console.log(err)
    }
})

document.querySelector("#calories-button").addEventListener('click', async () => {
    const weight = document.querySelector("#calories_weight").value
    const height = document.querySelector("#height").value
    const activity = ts.getValue()
    const age = document.querySelector("#age").value
    const gender = document.querySelector("input[type='radio'][name='gender']:checked").getAttribute('id')
    if (!weight || !height || !age || !gender) return
    console.log(gender)
    try {
        const res = await fetch(`/API/calculator`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                type: 'calories',
                weight: weight, 
                height: height,
                age: age,
                gender: gender,
                activity: activity
            })
        })
        if (!res.ok) {
            throw new Error(res.status)
        }
        const data = await res.json()
        const intake = data.intake
        show_results(calories, 'calories', intake)
    }
    catch (err) {
        console.log(err)
    }
})
