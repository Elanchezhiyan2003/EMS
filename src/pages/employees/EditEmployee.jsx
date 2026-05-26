// src/pages/employees/EditEmployee.jsx
import { useState } from "react"

export default function EditEmployee({ emp, onClose }) {

  const [form, setForm] = useState(emp)

  return (
    <div className="modal-bg">
      <div className="modal-box">
        <h3>Edit Employee</h3>

        <input value={form.employee_id} onChange={e=>setForm({...form, employee_id:e.target.value})}/>
        <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
        <input value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
        <input value={form.position} onChange={e=>setForm({...form, position:e.target.value})}/>

        <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
          <option>Employee</option>
          <option>Admin</option>
        </select>

        <div className="modal-actions">
          <button className="btn-edit">Update</button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
