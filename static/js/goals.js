const setGoal = document.querySelector(".setGoal")
const overlay = document.querySelector(".overlay")

function closeGoal() {
    overlay.classList.add('not-visible')
    setGoal.classList.add('not-visible')
}

document.querySelectorAll(".addGoal").forEach(button => {
    button.addEventListener("click", () => {
        setGoal.classList.remove('not-visible')
        overlay.classList.remove('not-visible')
        overlay.addEventListener("click", closeGoal, {once: true})
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

let oldGoalName = '' 

const makeEditable = (e) => {
    const container = event.target.closest(".goals-goal")
    const secondContainer = container?.querySelector(".goals-goal-inner")
    const h2 = secondContainer?.querySelector(".goal-name-container h2")
    console.log(h2)
    if (h2 === null) return
    oldGoalName = h2.textContent
    const newInput = document.createElement("input")
    newInput.value = oldGoalName
    newInput.classList.add("goals-input")
    h2.replaceWith(newInput)
    newInput.focus()

    const save = async () => {
        if (saved) return   
        saved = true
        const newH2 = document.createElement("h2")
        newH2.textContent = newInput.value
        newInput.replaceWith(newH2)
        if (newInput.value === oldGoalName) return
        try {
            const id = newH2.closest("div").dataset.id
            const res = await fetch("/API/updateGoals", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                  "type": "update",
                  "id": id,
                  "content": newInput.value
                })
            })
            if (!res.ok) {
                newH2.textContent = oldGoalName
                throw new Error(res.error || res.status)
            }
        }
        catch (err) {
            console.log(err)
            alert("Your settings could not be saved, try again.")
        }
    }
    let saved = false
    newInput.addEventListener("blur", save)
    newInput.addEventListener("keydown", (e) => {
        e.key === "Enter" && save()
    })
}



const deleteGoal = async (e, id) => {
  try {
    const res = await fetch("/API/updateGoals", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        "type": "delete",
        "id": id
      })
    })
    if (!res.ok) {
      throw new Error(res.error ?? res.status)
    }
    const goalsGoal = e.target.closest(".goals-goal")
    goalsGoal?.nextElementSibling.remove()
    goalsGoal.remove()
  }
  catch (err) {
    alert("Your request couldn't be processed")
    console.log(err)
  }
}

document.querySelectorAll(".svg-isDone").forEach(svg => {
  svg.addEventListener("mousemove", (e) => {
    const text = svg.querySelector(".isDoneSpan")
    text.style.left = e.offsetX + "px"
    text.style.top = e.offsetY + "px"
  })
  svg.addEventListener("click", async (e) => {
    const id = e.currentTarget.dataset.id
    const done = e.currentTarget.dataset.done
    try {
      const res = await fetch("/API/updateGoals", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        "type": "updateStatus",
        "id": id,
        "done": done
      })
    })
      if (!res.ok) {
        throw new Error(res.error ?? res.status);    
      }
      window.location.reload()
    }
    catch (err) {
      alert("Your request couldn't be processed")
      console.log(err)
    }
  })
})