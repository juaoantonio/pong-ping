import { roleLabel, tenantRoles, type TenantRole } from "@/features/system-admin/roles";
import { cn } from "@/lib/utils";

type RolePickerProps = {
  disabled?: boolean;
  onChange: (roles: TenantRole[]) => void;
  value: TenantRole[];
};

export function RolePicker({ disabled, onChange, value }: RolePickerProps) {
  function toggle(role: TenantRole) {
    if (value.includes(role)) {
      onChange(value.filter((item) => item !== role));
      return;
    }

    onChange([...value, role]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tenantRoles.map((role) => {
        const selected = value.includes(role);
        return (
          <label
            className={cn(
              "inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              disabled && "cursor-not-allowed opacity-50",
            )}
            key={role}
          >
            <input
              checked={selected}
              className="sr-only"
              disabled={disabled}
              onChange={() => toggle(role)}
              type="checkbox"
            />
            {roleLabel(role)}
          </label>
        );
      })}
    </div>
  );
}
