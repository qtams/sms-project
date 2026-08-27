import { useEffect, useMemo, useState } from "react";
import { FiBookOpen, FiCalendar, FiFolder, FiGrid, FiLayers, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import api from "../lib/api";

const emptyYear = { name: "", start_date: "", end_date: "", is_active: true };
const emptyUnit = { parent_id: "", code: "", name: "", type: "division", education_level: "basic", description: "", is_active: true };
const emptyProgram = { academic_unit_id: "", code: "", name: "", program_type: "program", description: "", is_active: true };
const emptyGrade = { academic_unit_id: "", academic_program_id: "", name: "", sort_order: 0, is_active: true };
const emptySection = { grade_level_id: "", school_year_id: "", name: "", capacity: "", is_active: true };
const errorMessage = (error) => error.response?.data?.message || "Something went wrong.";

const inputClass = "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50";
const primaryButton = "inline-flex h-11 w-max shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-cyan-600";

const Status = ({ active }) => (
  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
    {active ? "Active" : "Inactive"}
  </span>
);

const EmptyRow = ({ columns, label }) => (
  <tr><td colSpan={columns} className="px-4 py-12 text-center text-sm text-slate-500">No {label} found.</td></tr>
);

export default function GradeSections() {
  const [data, setData] = useState({ schoolYears: [], academicUnits: [], academicPrograms: [], gradeLevels: [], sections: [], teachers: [] });
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("sections");
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState(emptyYear);
  const [unit, setUnit] = useState(emptyUnit);
  const [program, setProgram] = useState(emptyProgram);
  const [grade, setGrade] = useState(emptyGrade);
  const [section, setSection] = useState(emptySection);

  const load = async () => {
    try { setData((await api.get("/api/academic-setup")).data); }
    catch (error) { toast.error(errorMessage(error)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const selectView = (key) => {
    setActiveView(key);
    setShowAddForm(false);
    setSearch("");
  };

  const submit = async (event, endpoint, values, reset) => {
    event.preventDefault();
    try {
      await api.post(`/api/academic-setup/${endpoint}`, values);
      reset();
      setShowAddForm(false);
      await load();
      toast.success("Saved successfully.");
    } catch (error) { toast.error(errorMessage(error)); }
  };

  const remove = async (type, id, label) => {
    const result = await Swal.fire({ title: `Delete ${label}?`, icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", confirmButtonText: "Delete" });
    if (!result.isConfirmed) return;
    try { await api.delete(`/api/academic-setup/${type}/${id}`); await load(); toast.success("Deleted successfully."); }
    catch (error) { toast.error(errorMessage(error)); }
  };

  const toggleTeacher = async (row, teacherId) => {
    const current = row.teachers.map((teacher) => teacher.id);
    const teacher_ids = current.includes(teacherId) ? current.filter((id) => id !== teacherId) : [...current, teacherId];
    try { await api.put(`/api/academic-setup/sections/${row.id}/teachers`, { teacher_ids }); await load(); toast.success("Teacher assignment updated."); }
    catch (error) { toast.error(errorMessage(error)); }
  };

  const filteredRows = useMemo(() => {
    const term = search.toLowerCase();
    if (activeView === "academicUnits") return data.academicUnits.filter((row) => `${row.code} ${row.name} ${row.type} ${row.education_level} ${row.parent?.name || ""}`.toLowerCase().includes(term));
    if (activeView === "academicPrograms") return data.academicPrograms.filter((row) => `${row.code} ${row.name} ${row.program_type} ${row.academic_unit?.name || ""}`.toLowerCase().includes(term));
    if (activeView === "schoolYears") return data.schoolYears.filter((row) => `${row.name} ${row.start_date || ""} ${row.end_date || ""}`.toLowerCase().includes(term));
    if (activeView === "gradeLevels") return data.gradeLevels.filter((row) => `${row.name} ${row.academic_unit?.name || ""} ${row.academic_program?.name || ""}`.toLowerCase().includes(term));
    return data.sections.filter((row) => `${row.name} ${row.grade_level?.name || ""} ${row.grade_level?.academic_unit?.name || ""} ${row.grade_level?.academic_program?.name || ""} ${row.school_year?.name || ""}`.toLowerCase().includes(term));
  }, [activeView, data, search]);

  const cards = [
    { key: "academicUnits", label: "Academic Units", singular: "Academic Unit", count: data.academicUnits.length, icon: FiGrid, color: "text-emerald-600", bg: "bg-emerald-50" },
    { key: "academicPrograms", label: "Programs / Tracks", singular: "Program / Track", count: data.academicPrograms.length, icon: FiFolder, color: "text-blue-600", bg: "bg-blue-50" },
    { key: "schoolYears", label: "School Years", singular: "School Year", count: data.schoolYears.length, icon: FiCalendar, color: "text-orange-600", bg: "bg-orange-50" },
    { key: "gradeLevels", label: "Grade Levels", singular: "Grade Level", count: data.gradeLevels.length, icon: FiBookOpen, color: "text-cyan-600", bg: "bg-cyan-50" },
    { key: "sections", label: "Sections", singular: "Section", count: data.sections.length, icon: FiLayers, color: "text-violet-600", bg: "bg-violet-50" },
  ];
  const activeCard = cards.find((card) => card.key === activeView);

  if (loading) return <p className="text-sm font-semibold text-slate-500">Loading academic setup...</p>;

  return <div className="space-y-6" data-aos="fade-up">
    <div><h1 className="text-2xl font-bold text-slate-900">Grade & Sections</h1><p className="mt-1 text-sm text-slate-500">Manage your academic structure and teacher assignments.</p></div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ key, label, count, icon: Icon, color, bg }) => <button key={key} type="button" onClick={() => selectView(key)} className={`flex items-center gap-4 rounded-xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${activeView === key ? "border-cyan-500 ring-4 ring-cyan-50" : "border-slate-200"}`}>
        <span className={`flex h-12 w-12 items-center justify-center rounded-lg ${bg} ${color}`}><Icon size={23}/></span>
        <span><span className="block text-sm font-semibold text-slate-500">{label}</span><span className="mt-1 block text-3xl font-black text-slate-900">{count}</span></span>
      </button>)}
    </div>

    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-lg font-bold text-slate-900">{activeCard.label}</h2><p className="text-sm text-slate-500">{filteredRows.length} record{filteredRows.length === 1 ? "" : "s"}</p></div>
        <div className="flex flex-col gap-3 sm:flex-row"><input className={`${inputClass} sm:w-64`} placeholder={`Search ${activeCard.label.toLowerCase()}...`} value={search} onChange={(event) => setSearch(event.target.value)}/><button type="button" onClick={() => setShowAddForm((open) => !open)} className={primaryButton}>{showAddForm ? <FiX/> : <FiPlus/>}{showAddForm ? "Close" : `Add ${activeCard.singular}`}</button></div>
      </div>

      {showAddForm && <div className="border-b border-slate-200 bg-slate-50 p-5">{activeView === "academicUnits" && <UnitForm value={unit} setValue={setUnit} units={data.academicUnits} onSubmit={(event) => submit(event, "academic-units", { ...unit, parent_id: unit.parent_id || null }, () => setUnit(emptyUnit))}/>} {activeView === "academicPrograms" && <ProgramForm value={program} setValue={setProgram} units={data.academicUnits} onSubmit={(event) => submit(event, "academic-programs", program, () => setProgram(emptyProgram))}/>} {activeView === "schoolYears" && <YearForm value={year} setValue={setYear} onSubmit={(event) => submit(event, "school-years", year, () => setYear(emptyYear))}/>} {activeView === "gradeLevels" && <GradeForm value={grade} setValue={setGrade} data={data} onSubmit={(event) => submit(event, "grade-levels", { ...grade, academic_program_id: grade.academic_program_id || null }, () => setGrade(emptyGrade))}/>} {activeView === "sections" && <SectionForm value={section} setValue={setSection} data={data} onSubmit={(event) => submit(event, "sections", { ...section, capacity: section.capacity || null }, () => setSection(emptySection))}/>}</div>}

      <div className="overflow-x-auto">
        {activeView === "academicUnits" && <AcademicUnitTable rows={filteredRows} onDelete={remove}/>}
        {activeView === "academicPrograms" && <AcademicProgramTable rows={filteredRows} onDelete={remove}/>}
        {activeView === "schoolYears" && <SchoolYearTable rows={filteredRows} onDelete={remove}/>}
        {activeView === "gradeLevels" && <GradeLevelTable rows={filteredRows} onDelete={remove}/>}
        {activeView === "sections" && <SectionTable rows={filteredRows} teachers={data.teachers} onDelete={remove} onToggleTeacher={toggleTeacher}/>}
      </div>
    </div>
  </div>;
}

const UnitForm = ({ value, setValue, units, onSubmit }) => <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-3 xl:grid-cols-6"><input className={inputClass} required placeholder="Code (e.g. JHS)" value={value.code} onChange={(e) => setValue({ ...value, code: e.target.value.toUpperCase() })}/><input className={inputClass} required placeholder="Academic unit name" value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })}/><select className={inputClass} value={value.parent_id} onChange={(e) => setValue({ ...value, parent_id: e.target.value })}><option value="">No parent unit</option>{units.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className={inputClass} value={value.type} onChange={(e) => setValue({ ...value, type: e.target.value })}><option value="division">Division</option><option value="college">College</option><option value="department">Department</option></select><select className={inputClass} value={value.education_level} onChange={(e) => setValue({ ...value, education_level: e.target.value })}><option value="basic">Basic Education</option><option value="higher_education">Higher Education</option></select><button className={primaryButton}><FiPlus/> Save Academic Unit</button></form>;

const ProgramForm = ({ value, setValue, units, onSubmit }) => <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><select className={inputClass} required value={value.academic_unit_id} onChange={(e) => setValue({ ...value, academic_unit_id: e.target.value })}><option value="">Select academic unit</option>{units.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input className={inputClass} required placeholder="Code (e.g. BSCE)" value={value.code} onChange={(e) => setValue({ ...value, code: e.target.value.toUpperCase() })}/><input className={inputClass} required placeholder="Program or track name" value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })}/><select className={inputClass} value={value.program_type} onChange={(e) => setValue({ ...value, program_type: e.target.value })}><option value="program">Program</option><option value="track">Track</option><option value="strand">Strand</option></select><button className={primaryButton}><FiPlus/> Save Program / Track</button></form>;

const YearForm = ({ value, setValue, onSubmit }) => <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-4"><input className={inputClass} required placeholder="2026 - 2027" value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })}/><input className={inputClass} type="date" value={value.start_date} onChange={(e) => setValue({ ...value, start_date: e.target.value })}/><input className={inputClass} type="date" value={value.end_date} onChange={(e) => setValue({ ...value, end_date: e.target.value })}/><button className={primaryButton}><FiPlus/> Save School Year</button></form>;

const GradeForm = ({ value, setValue, data, onSubmit }) => { const programs = data.academicPrograms.filter((item) => String(item.academic_unit_id) === String(value.academic_unit_id) && item.is_active); return <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-5"><select className={inputClass} required value={value.academic_unit_id} onChange={(e) => setValue({ ...value, academic_unit_id: e.target.value, academic_program_id: "" })}><option value="">Select academic unit</option>{data.academicUnits.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className={inputClass} value={value.academic_program_id} onChange={(e) => setValue({ ...value, academic_program_id: e.target.value })}><option value="">No program / track</option>{programs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input className={inputClass} required placeholder="Grade 7 or First Year" value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })}/><input className={inputClass} min="0" type="number" placeholder="Sort order" value={value.sort_order} onChange={(e) => setValue({ ...value, sort_order: e.target.value })}/><button className={primaryButton}><FiPlus/> Save Grade Level</button></form>; };

const SectionForm = ({ value, setValue, data, onSubmit }) => <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-5"><select className={inputClass} required value={value.grade_level_id} onChange={(e) => setValue({ ...value, grade_level_id: e.target.value })}><option value="">Grade level</option>{data.gradeLevels.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.academic_program?.name || item.academic_unit?.name}</option>)}</select><select className={inputClass} required value={value.school_year_id} onChange={(e) => setValue({ ...value, school_year_id: e.target.value })}><option value="">School year</option>{data.schoolYears.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input className={inputClass} required placeholder="Section name" value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })}/><input className={inputClass} min="1" type="number" placeholder="Capacity" value={value.capacity} onChange={(e) => setValue({ ...value, capacity: e.target.value })}/><button className={primaryButton}><FiPlus/> Save Section</button></form>;

const AcademicUnitTable = ({ rows, onDelete }) => <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-4">Academic Unit</th><th className="p-4">Parent</th><th className="p-4">Type</th><th className="p-4">Education Level</th><th className="p-4">Programs / Grades</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-slate-100"><td className="p-4 font-bold text-slate-900">{row.name}<div className="text-xs font-normal text-slate-500">{row.code}</div></td><td className="p-4">{row.parent?.name || "—"}</td><td className="p-4 capitalize">{row.type}</td><td className="p-4">{row.education_level === "higher_education" ? "Higher Education" : "Basic Education"}</td><td className="p-4">{row.programs_count} / {row.grade_levels_count}</td><td className="p-4"><Status active={row.is_active}/></td><td className="p-4 text-right"><DeleteButton onClick={() => onDelete("academic-units", row.id, row.name)}/></td></tr>)}{!rows.length && <EmptyRow columns={7} label="academic units"/>}</tbody></table>;

const AcademicProgramTable = ({ rows, onDelete }) => <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-4">Program / Track</th><th className="p-4">Academic Unit</th><th className="p-4">Type</th><th className="p-4">Grade Levels</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-slate-100"><td className="p-4 font-bold text-slate-900">{row.name}<div className="text-xs font-normal text-slate-500">{row.code}</div></td><td className="p-4">{row.academic_unit?.name}</td><td className="p-4 capitalize">{row.program_type}</td><td className="p-4">{row.grade_levels_count}</td><td className="p-4"><Status active={row.is_active}/></td><td className="p-4 text-right"><DeleteButton onClick={() => onDelete("academic-programs", row.id, row.name)}/></td></tr>)}{!rows.length && <EmptyRow columns={6} label="programs or tracks"/>}</tbody></table>;

const SchoolYearTable = ({ rows, onDelete }) => <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-4">School Year</th><th className="p-4">Start Date</th><th className="p-4">End Date</th><th className="p-4">Sections</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-slate-100"><td className="p-4 font-bold text-slate-900">{row.name}</td><td className="p-4 text-slate-600">{row.start_date || "—"}</td><td className="p-4 text-slate-600">{row.end_date || "—"}</td><td className="p-4">{row.sections_count}</td><td className="p-4"><Status active={row.is_active}/></td><td className="p-4 text-right"><DeleteButton onClick={() => onDelete("school-years", row.id, row.name)}/></td></tr>)}{!rows.length && <EmptyRow columns={6} label="school years"/>}</tbody></table>;

const GradeLevelTable = ({ rows, onDelete }) => <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-4">Grade Level</th><th className="p-4">Academic Unit</th><th className="p-4">Program / Track</th><th className="p-4">Sort Order</th><th className="p-4">Sections</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-slate-100"><td className="p-4 font-bold text-slate-900">{row.name}</td><td className="p-4 text-slate-600">{row.academic_unit?.name}</td><td className="p-4 text-slate-600">{row.academic_program?.name || "—"}</td><td className="p-4">{row.sort_order}</td><td className="p-4">{row.sections_count}</td><td className="p-4"><Status active={row.is_active}/></td><td className="p-4 text-right"><DeleteButton onClick={() => onDelete("grade-levels", row.id, row.name)}/></td></tr>)}{!rows.length && <EmptyRow columns={7} label="grade levels"/>}</tbody></table>;

const SectionTable = ({ rows, teachers, onDelete, onToggleTeacher }) => <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-4">Grade / Section</th><th className="p-4">School Year</th><th className="p-4">Capacity</th><th className="p-4">Teachers</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-slate-100"><td className="p-4 font-bold text-slate-900">{row.grade_level?.name} - {row.name}<div className="text-xs font-normal text-slate-500">{row.grade_level?.academic_program?.name || row.grade_level?.academic_unit?.name}</div></td><td className="p-4">{row.school_year?.name}</td><td className="p-4">{row.capacity || "—"}</td><td className="min-w-72 p-4"><div className="flex flex-wrap gap-1">{teachers.length ? teachers.map((teacher) => { const selected = row.teachers.some((item) => item.id === teacher.id); const name = teacher.staff_profile?.first_name ? `${teacher.staff_profile.first_name} ${teacher.staff_profile.last_name}` : teacher.username; return <button key={teacher.id} type="button" title={selected ? "Remove teacher" : "Assign teacher"} onClick={() => onToggleTeacher(row, teacher.id)} className={`rounded px-2 py-1 text-xs font-semibold ${selected ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{name}</button>; }) : <span className="text-slate-400">No active teacher accounts</span>}</div></td><td className="p-4"><Status active={row.is_active}/></td><td className="p-4 text-right"><DeleteButton onClick={() => onDelete("sections", row.id, row.name)}/></td></tr>)}{!rows.length && <EmptyRow columns={6} label="sections"/>}</tbody></table>;

const DeleteButton = ({ onClick }) => <button type="button" onClick={onClick} className="rounded-md p-2 text-red-500 transition hover:bg-red-50" aria-label="Delete"><FiTrash2/></button>;
