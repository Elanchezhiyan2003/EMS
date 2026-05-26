// src/pages/employees/AddEmployee.jsx

import { useState } from "react"
import { supabase } from "../../supabase/client"

export default function AddEmployee({ onClose, onEmployeeAdded }) {

  const [form, setForm] = useState({
    employee_id: "",
    name: "",
    email: "",
    role: "Employee",
    position: ""
  })

  const handleSave = async () => {

    // Basic validation
    if (!form.employee_id || !form.name || !form.email) {
      alert("Please fill all required fields")
      return
    }

    const { data, error } = await supabase
      .from("profiles")   // since you have only profiles table
      .insert([
        {
          employee_id: form.employee_id,
          name: form.name,      // make sure column name matches DB
          email: form.email,
          role: form.role,
          position: form.position
        }
      ])

    if (error) {
      console.log(error)
      alert(error.message)
    } else {
      alert("Employee added successfully ✅")

      // refresh employee list in parent page
      if (onEmployeeAdded) {
        onEmployeeAdded()
      }

      onClose()
    }
  }

  return (
    <div className="modal-bg">
      <div className="modal-box">
        <h3>Add Employee</h3>

        <input 
          placeholder="Employee ID" 
          onChange={e=>setForm({...form, employee_id:e.target.value})}
        />

        <input 
          placeholder="Name" 
          onChange={e=>setForm({...form, name:e.target.value})}
        />

        <input 
          placeholder="Email" 
          onChange={e=>setForm({...form, email:e.target.value})}
        />

        <input 
          placeholder="Position" 
          onChange={e=>setForm({...form, position:e.target.value})}
        />

        <select 
          onChange={e=>setForm({...form, role:e.target.value})}
          value={form.role}
        >
          <option>Employee</option>
          <option>Admin</option>
        </select>

        <div className="modal-actions">
          <button className="btn-add" onClick={handleSave}>
            Save
          </button>

          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}