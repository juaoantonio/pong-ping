import { useEffect, useState } from "react";
import { Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import type {
  AthleteGripStyleContract,
  AthletePlayingStyleContract,
  AthleteProfileContract,
  AthleteTechnicalLevelContract,
} from "@pong-ping/contracts";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateCoreAthleteProfileMutation } from "@/features/club/api/mutations";
import { useCurrentCoreAthleteQuery } from "@/features/club/api/queries";
import { QueryState, profileValue } from "@/features/club/club-ui";

const EMPTY_VALUE = "__empty";

export function ProfilePage() {
  const athlete = useCurrentCoreAthleteQuery();

  return (
    <PageShell
      description="Dados publicos do atleta usados em filas, jogos e ranking."
      eyebrow="Clube"
      title="Perfil"
    >
      <QueryState
        isError={athlete.isError}
        isLoading={athlete.isPending}
        onRetry={() => void athlete.refetch()}
      >
        {athlete.data ? <ProfileForm athlete={athlete.data} /> : (
          <EmptyState title="Atleta atual nao encontrado." />
        )}
      </QueryState>
    </PageShell>
  );
}

function ProfileForm({
  athlete,
}: {
  athlete: {
    id: string;
    displayName: string;
    profile: AthleteProfileContract;
  };
}) {
  const [displayName, setDisplayName] = useState(athlete.displayName);
  const [technicalLevel, setTechnicalLevel] = useState(athlete.profile.technicalLevel);
  const [gripStyle, setGripStyle] = useState(athlete.profile.gripStyle);
  const [playingStyle, setPlayingStyle] = useState(athlete.profile.playingStyle);
  const [bladeName, setBladeName] = useState(profileValue(athlete.profile.bladeName) === "Nao informado" ? "" : athlete.profile.bladeName ?? "");
  const [forehandRubberName, setForehandRubberName] = useState(athlete.profile.forehandRubberName ?? "");
  const [backhandRubberName, setBackhandRubberName] = useState(athlete.profile.backhandRubberName ?? "");
  const [equipmentNotes, setEquipmentNotes] = useState(athlete.profile.equipmentNotes ?? "");
  const updateProfile = useUpdateCoreAthleteProfileMutation();

  useEffect(() => {
    setDisplayName(athlete.displayName);
    setTechnicalLevel(athlete.profile.technicalLevel);
    setGripStyle(athlete.profile.gripStyle);
    setPlayingStyle(athlete.profile.playingStyle);
    setBladeName(athlete.profile.bladeName ?? "");
    setForehandRubberName(athlete.profile.forehandRubberName ?? "");
    setBackhandRubberName(athlete.profile.backhandRubberName ?? "");
    setEquipmentNotes(athlete.profile.equipmentNotes ?? "");
  }, [athlete]);

  return (
    <form
      className="grid gap-5 rounded-lg border bg-card p-5 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        updateProfile.mutate(
          {
            athleteId: athlete.id,
            input: {
              displayName: displayName.trim() || undefined,
              profile: {
                technicalLevel,
                gripStyle,
                playingStyle,
                bladeName: nullableText(bladeName),
                forehandRubberName: nullableText(forehandRubberName),
                backhandRubberName: nullableText(backhandRubberName),
                equipmentNotes: nullableText(equipmentNotes),
              },
            },
          },
          { onSuccess: () => toast.success("Perfil atualizado.") },
        );
      }}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <UserRound className="size-5" />
        </span>
        <div>
          <p className="font-medium">{athlete.displayName}</p>
          <p className="text-sm text-muted-foreground">{athlete.id}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome publico">
          <Input
            maxLength={120}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            value={displayName}
          />
        </Field>
        <Field label="Nivel tecnico">
          <Select
            onValueChange={(value) =>
              setTechnicalLevel(value === EMPTY_VALUE ? null : (value as AthleteTechnicalLevelContract))
            }
            value={technicalLevel ?? EMPTY_VALUE}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_VALUE}>Nao informado</SelectItem>
              <SelectItem value="beginner">Iniciante</SelectItem>
              <SelectItem value="intermediate">Intermediario</SelectItem>
              <SelectItem value="advanced">Avancado</SelectItem>
              <SelectItem value="competitive">Competitivo</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Empunhadura">
          <Select
            onValueChange={(value) =>
              setGripStyle(value === EMPTY_VALUE ? null : (value as AthleteGripStyleContract))
            }
            value={gripStyle ?? EMPTY_VALUE}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_VALUE}>Nao informado</SelectItem>
              <SelectItem value="classic">Classica</SelectItem>
              <SelectItem value="penhold">Caneta</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Estilo">
          <Select
            onValueChange={(value) =>
              setPlayingStyle(value === EMPTY_VALUE ? null : (value as AthletePlayingStyleContract))
            }
            value={playingStyle ?? EMPTY_VALUE}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_VALUE}>Nao informado</SelectItem>
              <SelectItem value="offensive">Ofensivo</SelectItem>
              <SelectItem value="defensive">Defensivo</SelectItem>
              <SelectItem value="all_round">All-round</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Madeira">
          <Input maxLength={120} onChange={(event) => setBladeName(event.target.value)} value={bladeName} />
        </Field>
        <Field label="Borracha forehand">
          <Input
            maxLength={120}
            onChange={(event) => setForehandRubberName(event.target.value)}
            value={forehandRubberName}
          />
        </Field>
        <Field label="Borracha backhand">
          <Input
            maxLength={120}
            onChange={(event) => setBackhandRubberName(event.target.value)}
            value={backhandRubberName}
          />
        </Field>
        <Field label="Notas de equipamento">
          <Input
            maxLength={500}
            onChange={(event) => setEquipmentNotes(event.target.value)}
            value={equipmentNotes}
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <Button disabled={updateProfile.isPending} type="submit">
          <Save className="size-4" />
          Salvar perfil
        </Button>
      </div>
    </form>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function nullableText(value: string) {
  return value.trim() ? value.trim() : null;
}
