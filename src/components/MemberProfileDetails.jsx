import { getMemberTypeLabel } from '../services/directoryService';

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">
        {value || '-'}
      </p>
    </div>
  );
}

function DetailsGroup({ title, children }) {
  return (
    <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h4 className="text-sm font-bold text-slate-950 sm:text-base">{title}</h4>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export default function MemberProfileDetails({ profile }) {
  if (!profile) return null;

  const memberTypeLabel =
    profile.member_type_label || getMemberTypeLabel(profile.member_type);

  const degrees =
    profile.member_degree_qualifications ||
    profile.degree_qualifications ||
    [];

  return (
    <div className="space-y-1">
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 to-emerald-900 p-4 text-white sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="mx-auto h-20 w-20 shrink-0 overflow-hidden rounded-3xl bg-white/10 ring-2 ring-white/20 sm:mx-0">
            {profile.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={profile.full_name || 'Member'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-black text-white/70">
                {(profile.full_name || '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
              {memberTypeLabel}
            </span>
            <h3 className="mt-3 break-words text-xl font-bold sm:text-2xl">
              {profile.full_name || profile.email || 'Unnamed Member'}
            </h3>
            {profile.email ? (
              <p className="mt-1 break-words text-sm text-slate-300">
                {profile.email}
              </p>
            ) : null}
            {profile.created_at ? (
              <p className="mt-1 text-sm text-slate-400">
                Registered{' '}
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <DetailsGroup title="Personal Information">
        <DetailItem label="Full Name" value={profile.full_name} />
        <DetailItem label="Nick Name" value={profile.nick_name} />
        <DetailItem label="Date of Birth" value={profile.date_of_birth} />
        <DetailItem label="Gender" value={profile.gender} />
        <DetailItem label="Blood Group" value={profile.blood_group} />
        <DetailItem label="Member Type" value={memberTypeLabel} />
      </DetailsGroup>

      <DetailsGroup title="Academic Information">
        <DetailItem
          label="Passing Year / Current Year"
          value={profile.academic_year}
        />
        <DetailItem
          label="University Subject"
          value={profile.university_subject}
        />
        <DetailItem label="Hall Name" value={profile.university_hall_name} />
        <DetailItem
          label="Admission Session"
          value={profile.first_year_admission_session}
        />
        <DetailItem
          label="SSC Institute"
          value={profile.ssc_institution_name}
        />
        <DetailItem label="SSC Group" value={profile.ssc_group} />
        <DetailItem
          label="SSC Passing Year"
          value={profile.ssc_passing_year}
        />
        <DetailItem
          label="HSC Institute"
          value={profile.hsc_institution_name}
        />
        <DetailItem label="HSC Group" value={profile.hsc_group} />
        <DetailItem
          label="HSC Passing Year"
          value={profile.hsc_passing_year}
        />
      </DetailsGroup>

      {degrees.length > 0 ? (
        <DetailsGroup title="Higher Degree">
          {degrees.map((degree, index) => (
            <div
              key={index}
              className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:col-span-2"
            >
              <DetailItem label="Degree" value={degree.degree_name} />
              <DetailItem
                label="Institution"
                value={degree.institution_name}
              />
              <DetailItem
                label="Subject / Department"
                value={degree.subject_department}
              />
              <DetailItem label="Passing Year" value={degree.passing_year} />
            </div>
          ))}
        </DetailsGroup>
      ) : null}

      <DetailsGroup title="Address Information">
        <DetailItem
          label="Union / Pouroshova"
          value={profile.union_pouroshova_name}
        />
        <DetailItem
          label="Ward / Village"
          value={profile.ward_village_name}
        />
        <DetailItem
          label="Para / Moholla"
          value={profile.para_moholla_name}
        />
        <DetailItem
          label="Present Address"
          value={profile.present_address}
        />
      </DetailsGroup>

      <DetailsGroup title="Professional Information">
        <DetailItem label="Occupation" value={profile.occupation} />
        <DetailItem
          label="Organization Type"
          value={profile.organization_type}
        />
        <DetailItem
          label="Organization Name"
          value={profile.organization_name}
        />
        <DetailItem label="Designation" value={profile.designation} />
        <DetailItem
          label="Professional Details"
          value={profile.professional_details}
        />
      </DetailsGroup>

      <DetailsGroup title="Contact Information">
        <DetailItem label="Email" value={profile.email} />
        <DetailItem label="Contact Number" value={profile.contact_number} />
        <DetailItem
          label="Facebook Profile"
          value={profile.facebook_profile_link}
        />
      </DetailsGroup>

      {profile.life_story ? (
        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h4 className="text-sm font-bold text-slate-950 sm:text-base">
            Memories and Stories
          </h4>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
            {profile.life_story}
          </p>
        </section>
      ) : null}
    </div>
  );
}

export function ProfileDetailsModal({
  open,
  onClose,
  loading,
  error,
  profile,
  title = 'Member Details',
}) {
  return (
    <div
      className={`fixed inset-0 z-50 transition ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        className={`absolute bottom-0 right-0 flex max-h-[92vh] w-full flex-col rounded-t-[28px] bg-white shadow-2xl transition-transform duration-300 md:top-0 md:max-h-none md:max-w-2xl md:rounded-l-[28px] md:rounded-t-none ${
          open
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-x-full md:translate-y-0'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Profile
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-950">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-2xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          {loading ? (
            <p className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              Loading profile details...
            </p>
          ) : null}

          {!loading && error ? (
            <p className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}

          {!loading && !error && !profile ? (
            <p className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              Profile not found.
            </p>
          ) : null}

          {!loading && !error && profile ? (
            <MemberProfileDetails profile={profile} />
          ) : null}
        </div>
      </aside>
    </div>
  );
}
