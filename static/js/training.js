const createWorkoutDiv = document.querySelector(".createWorkout")
const todaysWorkout = document.querySelector(".todays-workout-container")
const recentActivity = document.querySelector(".recent-activity-parent")
const noGoals = document.querySelector(".no-goals")
const currentGoals = document.querySelector(".current-goals-container")

document.addEventListener("DOMContentLoaded", async () => {
    setTimeout(() => {
        document.querySelector(".loader").classList.add("not-visible")
        document.querySelector(".training-article").classList.remove("not-visible")
    }, 1000);
    try {
        const res = await fetch(`/API/training`)
        if (res.status === 404) {
            todaysWorkout.classList.add("not-visible")
            todaysWorkout.style.display = 'none'   
            recentActivity.classList.add("not-visible")
            recentActivity.style.display = 'none' 
            currentGoals.classList.add("not-visible")
            currentGoals.style.display = 'none'
            document.querySelector(".sectionBreak").style.display = 'none'
            document.querySelector("#firstSectionBreak").style.display = 'none'
        }
        if (!res.ok) {
            throw new Error(res.status)
        }
        const data = await res.json()
        noGoals.style.display = 'none'
        createWorkoutDiv.style.display = 'none'
        const session = data.session
        const name = session.name
        const exercises = session.exercises
        const date = new Date()
        document.querySelector("#span-date").innerText = date
        document.querySelector("#training-name").innerText = name
        isTable

        exercises.forEach(exercise => {
            const div_parent = document.createElement('div')
            const div1 = document.createElement('div')
            const div2 = document.createElement('div')
            const div3 = document.createElement('div')
            
            div1.innerText = exercise.name
            div2.innerText = exercise.sets
            div3.innerText = exercise.reps
            
            div_parent.appendChild(div1)
            div_parent.appendChild(div2)
            div_parent.appendChild(div3)
            div_parent.classList.add('tableRow')
            div1.classList.add('rowItem')
            div2.classList.add('rowItem')
            div3.classList.add('rowItem')
            document.querySelector(".rows").appendChild(div_parent)
        })

        const goals = data.goals
        goals.forEach(goal => {
            const div = document.createElement('div')
            div.innerHTML = `<span>${goal.goal}</span><button class="current-goal-check" data-i18n="training:done" data-id="${goal.id}"></button>`
            div.classList.add('current-goal')
            document.querySelector(".current-goals-container").appendChild(div)
        })
        
    }
    catch (err) {
        console.log(`Error - ${err}`)
    }
})

const setGoal = document.querySelector(".setGoal")
const overlay = document.querySelector(".overlay")
document.querySelector("#addGoal").addEventListener("click", () => {
    setGoal.classList.remove('not-visible')
    overlay.classList.remove('not-visible')
    overlay.addEventListener("click", () => {
        overlay.classList.add('not-visible')
        setGoal.classList.add('not-visible')
    })
})

document.querySelector("#saveGoal").addEventListener('click', async () => {
    const goalInput = document.querySelector("#setGoal")
    if (goalInput.value === '' || !goalInput.value) return
    try {
        const res = await fetch('/API/training/goals', {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                goal: goalInput.value
            })
        })
        if (!res.ok) {
            throw new Error(res.status)
        }
        location.reload()
    }
    catch (err) {
        console.log(`Error - ${err}`)
        setGoal.style.border = '1px solid #ef4444'
        setGoal.style.boxShadow = '0 0 4px 4px rgba(239, 68, 68, 0.2)'
    }
})

const trainingAdder = document.querySelector(".training-adder")

const nextButton = document.querySelector("#next")
const previousButton = document.querySelector("#previous")
const removeButton = document.querySelector("#remove")

let now = 0;

document.querySelector(".createWorkout button").addEventListener('click', () => {
    const values = {}

    if (now === 0) {
        document.querySelector(".training-name").classList.remove('not-visible')
        document.querySelector(".training-name input").value = ''
        document.querySelector(".training-exercise").classList.add('not-visible')
        document.querySelectorAll(".training-exercise input").forEach(i => [
            i.value = ''
        ])
    }

    trainingAdder.classList.remove('not-visible')
    overlay.classList.remove('not-visible')
    overlay.addEventListener("click", () => {
        overlay.classList.add('not-visible')
        trainingAdder.classList.add('not-visible')
    })
    if (!document.querySelector(".training-name").classList.contains('not-visible')) {
        previousButton.classList.add('not-visible')
        removeButton.classList.add('not-visible')
    }
    
    const exercise = document.querySelector("#exercise")
    const sets = document.querySelector("#sets")
    const reps = document.querySelector("#reps")
    const breaks = document.querySelector("#breaks")

    nextButton.addEventListener('click', () => {
        now++
        if (now === 1) {
            const trainingName = document.querySelector("#trainingName").value
            values['trainingName'] = trainingName
            document.querySelector(".training-name").classList.add('not-visible')
            document.querySelector(".training-exercise").classList.remove('not-visible')
            previousButton.classList.remove('not-visible')
            removeButton.classList.remove('not-visible')
        }
        else {
            const e = exercise.value
            const s = sets.value
            const r = reps.value
            const b = breaks.value
            const new_exercise = {}
            new_exercise['exercise'] = e
            new_exercise['sets'] = s
            new_exercise['reps'] = r
            new_exercise['breaks'] = b
            values[now - 1] = new_exercise
        }
        console.log(values)
    })

    previousButton.addEventListener('click', () => {
        now--
        if (now <= 0) {
            now = 0

            document.querySelector(".training-name").classList.remove('not-visible')
            document.querySelector(".training-exercise").classList.add('not-visible')
        }
        else {
            const current_values = values[now]

            exercise.value = current_values.exercise
            sets.value = current_values.sets
            reps.value = current_values.reps
            breaks.value = current_values.breaks
        }
        console.log(values)
    })

    document.querySelector(".exit-adder").addEventListener('click', () => {
        now = 0
        overlay.classList.add('not-visible')
        trainingAdder.classList.add('not-visible')
    })
})