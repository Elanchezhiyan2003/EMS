// src/pages/employees/EmployeeList.jsx

import React, { useEffect, useState } from "react"
import { supabase } from "../../supabase/client"
import "./employee.css"

const EmployeeList = () => {
  const [employees, setEmployees] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    position: ""
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  // Fetch Employees
  async function fetchEmployees() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")

    if (error) {
      console.error("Fetch Error:", error.message)
    } else {
      setEmployees(data || [])
    }
  }

  // Handle input change
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Add / Edit Employee
  async function handleSubmit(e) {
    e.preventDefault()

    if (editingEmployee) {
      // update existing profile
      const { error } = await supabase
        .from('profiles')
        .update({
          name: form.name,
          email: form.email,
          role: form.role,
          position: form.position
        })
        .eq('id', editingEmployee.id)

      if (error) {
        alert('Update Error: ' + error.message)
        return
      }

      alert('Employee Updated Successfully')
    } else {
      // insert new profile
      const { error } = await supabase
        .from('profiles')
        .insert([
          {
            employee_id: 'EMP-' + Math.floor(1000 + Math.random() * 9000),
            name: form.name,
            email: form.email,
            role: form.role,
            position: form.position
          }
        ])

      if (error) {
        alert('Insert Error: ' + error.message)
        return
      }

      alert('Employee Added Successfully')
    }

    setShowModal(false)
    setForm({ name: '', email: '', role: '', position: '' })
    setEditingEmployee(null)
    fetchEmployees()
  }

  // Edit handler
  function handleEditClick(emp, e) {
    if (e) e.stopPropagation()
    setEditingEmployee(emp)
    setForm({ name: emp.name || '', email: emp.email || '', role: emp.role || '', position: emp.position || '' })
    setShowModal(true)
  }

  // Delete handler
  async function handleDeleteClick(emp, e) {
    if (e) e.stopPropagation()
    const ok = window.confirm(`Delete ${emp.name}?`)
    if (!ok) return
    const { error } = await supabase.from('profiles').delete().eq('id', emp.id)
    if (error) {
      alert('Delete error: ' + error.message)
      return
    }
    fetchEmployees()
  }

  return (
    <div className="employee-page">
      <div className="employee-header">
        <h2>People</h2>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          + Add Employee
        </button>
      </div>

      {/* EMPLOYEE GRID */}
      <div className="employee-grid">
        {employees.map(emp => (
          <div className="employee-card" key={emp.id}>
            <div className="emp-img">
              <img
                src={`https://ui-avatars.com/api/?name=${emp.name}&background=random`}
                alt="avatar"
              />
            </div>

            <h3>{emp.name}</h3>
            <p className="email">{emp.email}</p>
            <p className="role">{emp.role}</p>
            <p className="position">{emp.position}</p>

            <div className="card-actions">
              <button className="edit-btn" onClick={(e) => handleEditClick(emp, e)}>Edit</button>
              <button className="delete-btn" onClick={(e) => handleDeleteClick(emp, e)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>New Employee Details</h3>

            <form onSubmit={handleSubmit}>
              <input
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <input
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                required
              />

              <input
                name="role"
                placeholder="Role (admin / employee)"
                value={form.role}
                onChange={handleChange}
                required
              />

              <input
                name="position"
                placeholder="Job Position"
                value={form.position}
                onChange={handleChange}
                required
              />

              <div className="modal-buttons">
                <button type="submit" className="save-btn">Save</button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeList