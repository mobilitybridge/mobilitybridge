"""Generate FAKE demo data for the alumni directory.

Writes:
  supabase/seed.sql                 200 fake alumni with 1-2 mobilities each
  demo-data/neo_sample_messy.csv    a deliberately messy "NEO spreadsheet" for the import demo

Every person here is invented. Emails use example.com (reserved for examples) and no phone
numbers are generated, so nothing can reach a real person. The output is deterministic:
the same seed always gives the same files.

Run from apps/alumni-directory:  python3 scripts/generate_demo_data.py
"""

import csv
import random
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
rng = random.Random(2026)
NAMESPACE = uuid.UUID("6f1c2a52-6a0e-4c47-9d37-6b7a1f0e2b11")

UNIVERSITIES = [
    # name_en, name_ar, city, aliases
    ("An-Najah National University", "جامعة النجاح الوطنية", "Nablus", ["An-Najah", "Najah", "جامعة النجاح", "النجاح"]),
    ("Birzeit University", "جامعة بيرزيت", "Birzeit", ["BZU", "Birzeit Univ.", "بيرزيت"]),
    ("Palestine Polytechnic University", "جامعة بوليتكنك فلسطين", "Hebron", ["PPU", "Polytechnic", "بوليتكنك فلسطين", "البوليتكنك"]),
    ("Hebron University", "جامعة الخليل", "Hebron", ["HU", "الخليل"]),
    ("Al-Quds University", "جامعة القدس", "Abu Dis", ["AQU", "Al Quds University", "القدس"]),
    ("Bethlehem University", "جامعة بيت لحم", "Bethlehem", ["BU", "بيت لحم"]),
    ("Arab American University", "الجامعة العربية الأمريكية", "Jenin", ["AAUP", "AAU", "العربية الأمريكية"]),
    ("Palestine Technical University - Kadoorie", "جامعة فلسطين التقنية - خضوري", "Tulkarm", ["PTUK", "Kadoorie", "خضوري"]),
    ("Islamic University of Gaza", "الجامعة الإسلامية بغزة", "Gaza", ["IUG", "الجامعة الإسلامية"]),
    ("Al-Azhar University - Gaza", "جامعة الأزهر - غزة", "Gaza", ["Al-Azhar", "الأزهر"]),
]
UNI_WEIGHTS = [16, 16, 12, 9, 10, 7, 9, 6, 9, 6]

# (ISO code, English name, Arabic name, host institutions, weight)
HOSTS = [
    ("RO", "Romania", "رومانيا", ["Dunărea de Jos University of Galați", "Babeș-Bolyai University", "University of Bucharest"], 14),
    ("ES", "Spain", "إسبانيا", ["University of Granada", "University of Valencia", "University of Barcelona"], 13),
    ("IT", "Italy", "إيطاليا", ["University of Bologna", "Sapienza University of Rome"], 11),
    ("PL", "Poland", "بولندا", ["University of Warsaw", "Jagiellonian University"], 10),
    ("DE", "Germany", "ألمانيا", ["University of Göttingen", "TU Dresden"], 9),
    ("PT", "Portugal", "البرتغال", ["University of Porto", "University of Lisbon"], 8),
    ("FR", "France", "فرنسا", ["Université Côte d'Azur", "Université Grenoble Alpes"], 6),
    ("CZ", "Czechia", "التشيك", ["Masaryk University"], 4),
    ("BE", "Belgium", "بلجيكا", ["Ghent University", "KU Leuven"], 4),
    ("GR", "Greece", "اليونان", ["Aristotle University of Thessaloniki"], 4),
    ("TR", "Türkiye", "تركيا", ["Middle East Technical University"], 4),
    ("HU", "Hungary", "هنغاريا", ["University of Szeged"], 3),
    ("LT", "Lithuania", "ليتوانيا", ["Vilnius University"], 3),
    ("SI", "Slovenia", "سلوفينيا", ["University of Ljubljana"], 2),
    ("EE", "Estonia", "إستونيا", ["University of Tartu"], 2),
    ("FI", "Finland", "فنلندا", ["University of Helsinki"], 2),
    ("NL", "Netherlands", "هولندا", ["Utrecht University"], 2),
    ("AT", "Austria", "النمسا", ["University of Vienna"], 2),
    ("SE", "Sweden", "السويد", ["Lund University"], 2),
    ("IE", "Ireland", "أيرلندا", ["University College Dublin"], 1),
    ("LV", "Latvia", "لاتفيا", ["Riga Technical University"], 1),
]

MALE = [("محمد", "Mohammad"), ("أحمد", "Ahmad"), ("يوسف", "Yousef"), ("عمر", "Omar"), ("خالد", "Khaled"),
        ("إبراهيم", "Ibrahim"), ("علي", "Ali"), ("حسن", "Hasan"), ("سامر", "Samer"), ("طارق", "Tareq"),
        ("باسل", "Basel"), ("رامي", "Rami"), ("مهند", "Mohannad"), ("أنس", "Anas"), ("قيس", "Qais")]
FEMALE = [("سارة", "Sara"), ("ليان", "Layan"), ("رهف", "Rahaf"), ("دانا", "Dana"), ("مريم", "Maryam"),
          ("نور", "Nour"), ("هبة", "Heba"), ("آية", "Aya"), ("رنا", "Rana"), ("لينا", "Lina"),
          ("سلمى", "Salma"), ("جنى", "Jana"), ("ريم", "Reem"), ("ياسمين", "Yasmin"), ("تالا", "Tala")]
FAMILY = [("أبو زيد", "Abu Zaid"), ("الشريف", "Al-Sharif"), ("حمدان", "Hamdan"), ("عودة", "Odeh"),
          ("النجار", "Al-Najjar"), ("صلاح", "Salah"), ("الخطيب", "Al-Khatib"), ("منصور", "Mansour"),
          ("داود", "Dawood"), ("عيسى", "Issa"), ("قاسم", "Qasem"), ("ياسين", "Yaseen"), ("حداد", "Haddad"),
          ("سعادة", "Saadeh"), ("زيدان", "Zidan"), ("عابدين", "Abdeen"), ("الحلبي", "Al-Halabi"), ("سلامة", "Salameh")]

FIELDS = ["Computer Science", "Civil Engineering", "Business Administration", "English Literature", "Pharmacy",
          "Nursing", "Architecture", "Law", "Education", "Electrical Engineering", "Mathematics",
          "Media and Journalism", "Agriculture", "Biology", "Economics"]
JOBS = ["Software Engineer", "Teaching Assistant", "Lecturer", "Project Coordinator", "Civil Engineer",
        "Pharmacist", "Data Analyst", "Architect", "Researcher", "Journalist", "Nurse", "Lawyer", "Accountant"]
ORGS = ["Zaytoon Labs", "Sanabel Software", "Qamar Consulting", "Karma Engineering", "Hayat Health Center",
        "Nawras Media", "Ard Agritech"]
STORIES = [
    "My semester abroad taught me to work in international teams. I now help students at my university apply.",
    "I came back with a research direction and a network of colleagues I still work with.",
    "Living alone abroad for the first time changed how I plan and manage my work.",
    "فتح لي التبادل الطلابي الباب لدراسة الماجستير، وأساعد الآن الطلاب في التقديم.",
    "تعلمت لغة جديدة وبنيت علاقات مهنية ما زالت مستمرة حتى اليوم.",
]


def sql(value):
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, list):
        return "array[" + ", ".join(sql(v) for v in value) + "]::text[]"
    return "'" + str(value).replace("'", "''") + "'"


def pick_mobility(level_hint=None):
    code, _, _, insts, _ = rng.choices(HOSTS, weights=[h[4] for h in HOSTS])[0]
    roll = rng.random()
    year = rng.randint(2018, 2025)
    if roll < 0.70:
        program, level = "credit_mobility", rng.choices(["bachelor", "master", "phd"], [65, 28, 7])[0]
        if rng.random() < 0.5:
            start, end = f"{year}-09-{rng.randint(20, 30)}", f"{year + 1}-02-{rng.randint(1, 20):02d}"
        else:
            start, end = f"{year + 1}-02-{rng.randint(10, 28)}", f"{year + 1}-06-{rng.randint(15, 30)}"
    elif roll < 0.85:
        program, level = "erasmus_mundus", "master"
        start, end = f"{year}-09-01", f"{year + 2}-07-15"
    elif roll < 0.97:
        program, level = "staff_mobility", "staff"
        day = rng.randint(1, 20)
        month = rng.randint(3, 11)
        start, end = f"{year + 1}-{month:02d}-{day:02d}", f"{year + 1}-{month:02d}-{day + 5:02d}"
    else:
        program, level = "other", None
        start, end = None, None
    return {
        "program": program, "level": level_hint or level, "host_country": code,
        "host_institution": rng.choice(insts), "academic_year": f"{year}/{year + 1}",
        "start_date": start, "end_date": end,
    }


def make_people(count=200):
    people, used_emails = [], set()
    for i in range(count):
        gender = rng.choice(["female", "male"])
        first_ar, first_en = rng.choice(FEMALE if gender == "female" else MALE)
        fam_ar, fam_en = rng.choice(FAMILY)
        base = f"{first_en}.{fam_en}".lower().replace(" ", "").replace("-", "")
        email = f"{base}@example.com"
        n = 2
        while email in used_emails:
            email, n = f"{base}{n}@example.com", n + 1
        used_emails.add(email)

        uni = rng.choices(UNIVERSITIES, weights=UNI_WEIGHTS)[0]
        mobilities = [pick_mobility()]
        if rng.random() < 0.18:
            mobilities.append(pick_mobility())
        is_staff = all(m["program"] == "staff_mobility" for m in mobilities)

        self_registered = rng.random() < 0.6
        visibility = rng.choices(["neo_only", "alumni", "public"], [40, 40, 20])[0] if self_registered else "neo_only"
        abroad = rng.random() < 0.18
        people.append({
            "id": str(uuid.uuid5(NAMESPACE, f"alumnus-{i}")),
            "full_name_en": f"{first_en} {fam_en}",
            "full_name_ar": f"{first_ar} {fam_ar}",
            "email": email,
            "gender": gender,
            "university": uni[0],
            "field_of_study": "Academic staff" if is_staff else rng.choice(FIELDS),
            "current_job_title": rng.choice(JOBS) if rng.random() < 0.75 else None,
            "current_organization": rng.choice(ORGS) if rng.random() < 0.5 else None,
            "current_country": rng.choice(["DE", "IT", "ES", "FR", "TR"]) if abroad else "PS",
            "story": rng.choice(STORIES) if self_registered and rng.random() < 0.5 else None,
            "consent": self_registered,
            "visibility": visibility,
            "source": "self" if self_registered else "import",
            "verified": self_registered and rng.random() < 0.7,
            "created_at": f"2026-{rng.randint(1, 10):02d}-{rng.randint(1, 28):02d}",
            "mobilities": mobilities,
            "duplicate_of": None,
        })

    # A few self-registrations that repeat an earlier person, so the directory has flagged rows to show.
    for original_index in (3, 41, 117):
        o = people[original_index]
        dup = dict(o, id=str(uuid.uuid5(NAMESPACE, f"duplicate-{original_index}")),
                   full_name_en=o["full_name_en"].replace("Mohammad", "Mohammed"),
                   source="self", consent=True, visibility="alumni", verified=False,
                   created_at="2026-11-01", duplicate_of=o["id"], mobilities=[o["mobilities"][0]])
        people.append(dup)
    return people


def write_seed(people):
    lines = [
        "-- FAKE demo data, generated by scripts/generate_demo_data.py. Do not edit by hand.",
        "-- Every person is invented; emails use example.com and there are no phone numbers.",
        "",
    ]
    for name_en, name_ar, city, aliases in UNIVERSITIES:
        lines.append(f"insert into public.universities (name_en, name_ar, city, aliases) values "
                     f"({sql(name_en)}, {sql(name_ar)}, {sql(city)}, {sql(aliases)});")
    lines.append("")
    for p in people:
        consent_at = f"'{p['created_at']}'::timestamptz" if p["consent"] else "null"
        lines.append(
            "insert into public.alumni (id, full_name_en, full_name_ar, email, gender, home_university_id, "
            "field_of_study, current_job_title, current_organization, current_country, story, consent_given_at, "
            "visibility, source, possible_duplicate_of, verified, created_at) values ("
            f"{sql(p['id'])}, {sql(p['full_name_en'])}, {sql(p['full_name_ar'])}, {sql(p['email'])}, "
            f"{sql(p['gender'])}, (select id from public.universities where name_en = {sql(p['university'])}), "
            f"{sql(p['field_of_study'])}, {sql(p['current_job_title'])}, {sql(p['current_organization'])}, "
            f"{sql(p['current_country'])}, {sql(p['story'])}, {consent_at}, {sql(p['visibility'])}, "
            f"{sql(p['source'])}, {sql(p['duplicate_of'])}, {sql(p['verified'])}, '{p['created_at']}'::timestamptz);"
        )
    lines.append("")
    for p in people:
        for m in p["mobilities"]:
            lines.append(
                "insert into public.mobilities (alumni_id, program, level, host_country, host_institution, "
                "academic_year, start_date, end_date) values ("
                f"{sql(p['id'])}, {sql(m['program'])}, {sql(m['level'])}, {sql(m['host_country'])}, "
                f"{sql(m['host_institution'])}, {sql(m['academic_year'])}, {sql(m['start_date'])}, {sql(m['end_date'])});"
            )
    (ROOT / "supabase" / "seed.sql").write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_messy_sheet(people):
    """A sheet shaped like what an office might really keep: mixed languages, inconsistent
    spellings, one row per trip. Contains, on purpose:
      - 2 people already in the seed with the same email          -> 'same person, merge'
      - 1 person already in the seed under a respelled name        -> 'possible duplicate'
      - 1 person listed twice in this file (two trips)             -> grouped into one alumnus
      - 1 row with an unknown country and 1 with no name           -> shown as errors, not imported
    """
    headers = ["الاسم", "Name (English)", "E-mail", "الجامعة", "Host Country", "Host University",
               "Program", "Level", "Academic Year", "Field", "Current Job"]
    country_spellings = {h[0]: [h[1], h[1].lower() + " ", h[2], h[0]] for h in HOSTS}
    uni_spellings = {u[0]: [u[0], u[1]] + u[3] for u in UNIVERSITIES}
    program_spellings = {
        "credit_mobility": ["Erasmus+ KA171", "تبادل طلابي", "Credit mobility", "ICM"],
        "erasmus_mundus": ["Erasmus Mundus", "EMJM", "إيراسموس موندوس"],
        "staff_mobility": ["Staff mobility", "تبادل موظفين", "Staff training"],
        "other": ["Other"],
    }
    level_spellings = {"bachelor": ["BA", "بكالوريوس", "Bachelor"], "master": ["MA", "ماجستير", "MSc"],
                       "phd": ["PhD", "دكتوراه"], "staff": ["Staff", "موظف"], None: [""]}

    def year_spelling(y):
        a, b = y.split("/")
        return rng.choice([f"{a}-{b}", f"{a}/{b[2:]}", y, f"{a[2:]}/{b[2:]}"])

    def row(name_ar, name_en, email, uni, m, field, job):
        return [name_ar, name_en, email, rng.choice(uni_spellings[uni]),
                rng.choice(country_spellings[m["host_country"]]), m["host_institution"],
                rng.choice(program_spellings[m["program"]]), rng.choice(level_spellings[m["level"]]),
                year_spelling(m["academic_year"]), field, job or ""]

    rows = []
    # New people, never seen before (one of them with two trips).
    for i in range(14):
        gender = rng.choice(["female", "male"])
        first_ar, first_en = rng.choice(FEMALE if gender == "female" else MALE)
        fam_ar, fam_en = rng.choice(FAMILY)
        email = f"{first_en}.{fam_en}.new{i}".lower().replace(" ", "").replace("-", "") + "@example.com"
        uni = rng.choices(UNIVERSITIES, weights=UNI_WEIGHTS)[0][0]
        trips = 2 if i == 5 else 1
        for _ in range(trips):
            m = pick_mobility()
            rows.append(row(f"{first_ar} {fam_ar}", f"{first_en} {fam_en}", email if rng.random() < 0.8 or trips == 2 else "",
                            uni, m, rng.choice(FIELDS), rng.choice(JOBS) if rng.random() < 0.5 else ""))

    # Same email as seed people (upper-cased, as offices often type them) -> same person.
    for idx in (10, 25):
        p = people[idx]
        rows.append(row(p["full_name_ar"], p["full_name_en"], p["email"].upper(), p["university"],
                        pick_mobility(), p["field_of_study"], p["current_job_title"]))

    # Seed person with a respelled name and no email -> possible duplicate for NEO to decide.
    p = people[60]
    respelled_ar = p["full_name_ar"].replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    respelled_en = p["full_name_en"].replace("Al-", "Al ").replace("ou", "u").replace("Mohammad", "Muhammed")
    rows.append(row(respelled_ar, respelled_en, "", p["university"], p["mobilities"][0], p["field_of_study"], ""))

    # Broken rows.
    bad = pick_mobility()
    bad_row = row("رامي التجريبي", "Rami Test", "", UNIVERSITIES[0][0], bad, "Law", "")
    bad_row[4] = "Atlantis"
    rows.append(bad_row)
    rows.append(["", "", "", "PPU", "Spain", "University of Granada", "Erasmus+ KA171", "BA", "2024-2025", "Law", ""])

    rng.shuffle(rows)
    out = ROOT / "demo-data" / "neo_sample_messy.csv"
    out.parent.mkdir(exist_ok=True)
    with out.open("w", encoding="utf-8-sig", newline="") as f:  # BOM so Excel shows Arabic correctly
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)


if __name__ == "__main__":
    everyone = make_people()
    write_seed(everyone)
    write_messy_sheet(everyone)
    print(f"seed.sql: {len(everyone)} alumni; demo-data/neo_sample_messy.csv written")
