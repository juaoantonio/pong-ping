"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubmitEvent, useState, useTransition } from "react";
import { useAuthenticatedUser } from "@/components/auth/authenticated-user-provider";
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
import { Textarea } from "@/components/ui/textarea";
import { readApiError } from "@/lib/client-utils";
import type { AuthenticatedUserResponse } from "@/lib/auth/shared";
import type { AthleteEditableProfile } from "@/lib/athletes/profile";
import { toast } from "sonner";

type ProfileFormProps = {
  initialProfile: AthleteEditableProfile;
};

type ProfileFormValues = {
  name: string;
  technicalLevel: string | null;
  gripStyle: string | null;
  playingStyle: string | null;
  bladeName: string;
  forehandRubberName: string;
  backhandRubberName: string;
  equipmentNotes: string;
};

const EMPTY_SELECT_VALUE = "__none";

const technicalLevelOptions = [
  { value: "beginner", label: "Iniciante" },
  { value: "intermediate", label: "Intermediario" },
  { value: "advanced", label: "Avancado" },
  { value: "competitive", label: "Competitivo" },
];

const gripStyleOptions = [
  { value: "classic", label: "Classica" },
  { value: "penhold", label: "Caneta" },
];

const playingStyleOptions = [
  { value: "offensive", label: "Ofensivo" },
  { value: "defensive", label: "Defensivo" },
  { value: "all_round", label: "All-round" },
];

function toFormValues(profile: AthleteEditableProfile): ProfileFormValues {
  return {
    name: profile.name ?? "",
    technicalLevel: profile.technicalLevel,
    gripStyle: profile.gripStyle,
    playingStyle: profile.playingStyle,
    bladeName: profile.bladeName ?? "",
    forehandRubberName: profile.forehandRubberName ?? "",
    backhandRubberName: profile.backhandRubberName ?? "",
    equipmentNotes: profile.equipmentNotes ?? "",
  };
}

function normalizeFormValues(values: ProfileFormValues) {
  return {
    name: values.name.trim(),
    technicalLevel: values.technicalLevel,
    gripStyle: values.gripStyle,
    playingStyle: values.playingStyle,
    bladeName: values.bladeName.trim(),
    forehandRubberName: values.forehandRubberName.trim(),
    backhandRubberName: values.backhandRubberName.trim(),
    equipmentNotes: values.equipmentNotes.trim(),
  };
}

function SelectField({
  disabled,
  id,
  label,
  onValueChange,
  options,
  placeholder,
  value,
}: {
  disabled: boolean;
  id: string;
  label: string;
  onValueChange: (value: string | null) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  value: string | null;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        disabled={disabled}
        onValueChange={(nextValue) =>
          onValueChange(nextValue === EMPTY_SELECT_VALUE ? null : nextValue)
        }
        value={value ?? EMPTY_SELECT_VALUE}
      >
        <SelectTrigger className="w-full" id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={EMPTY_SELECT_VALUE}>Nao informado</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const router = useRouter();
  const { mutateUser } = useAuthenticatedUser();
  const [savedValues, setSavedValues] = useState(() =>
    toFormValues(initialProfile),
  );
  const [values, setValues] = useState(savedValues);
  const [isPending, startTransition] = useTransition();
  const normalizedValues = normalizeFormValues(values);
  const normalizedSavedValues = normalizeFormValues(savedValues);
  const hasChanges =
    JSON.stringify(normalizedValues) !== JSON.stringify(normalizedSavedValues);

  function updateValue<Key extends keyof ProfileFormValues>(
    key: Key,
    value: ProfileFormValues[Key],
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  }

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        toast.error(
          await readApiError(response, "Nao foi possivel atualizar o perfil."),
        );
        return;
      }

      const body = (await response.json()) as AuthenticatedUserResponse;
      if (body.user) {
        await mutateUser(body.user);
      }
      setValues(normalizedValues);
      setSavedValues(normalizedValues);
      toast.success("Perfil atualizado.");
      router.refresh();
    });
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="profile-name">Nome</Label>
          <Input
            disabled={isPending}
            id="profile-name"
            maxLength={80}
            minLength={2}
            onChange={(event) => updateValue("name", event.target.value)}
            placeholder="Seu nome"
            required
            value={values.name}
          />
        </div>

        <SelectField
          disabled={isPending}
          id="profile-technical-level"
          label="Nivel tecnico"
          onValueChange={(value) => updateValue("technicalLevel", value)}
          options={technicalLevelOptions}
          placeholder="Selecione o nivel"
          value={values.technicalLevel}
        />
        <SelectField
          disabled={isPending}
          id="profile-grip-style"
          label="Empunhadura"
          onValueChange={(value) => updateValue("gripStyle", value)}
          options={gripStyleOptions}
          placeholder="Selecione a empunhadura"
          value={values.gripStyle}
        />
        <SelectField
          disabled={isPending}
          id="profile-playing-style"
          label="Estilo de jogo"
          onValueChange={(value) => updateValue("playingStyle", value)}
          options={playingStyleOptions}
          placeholder="Selecione o estilo"
          value={values.playingStyle}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="profile-blade">Madeira</Label>
          <Input
            disabled={isPending}
            id="profile-blade"
            maxLength={120}
            onChange={(event) => updateValue("bladeName", event.target.value)}
            placeholder="Ex: Viscaria"
            value={values.bladeName}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="profile-forehand-rubber">Borracha forehand</Label>
          <Input
            disabled={isPending}
            id="profile-forehand-rubber"
            maxLength={120}
            onChange={(event) =>
              updateValue("forehandRubberName", event.target.value)
            }
            placeholder="Ex: Tenergy 05"
            value={values.forehandRubberName}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="profile-backhand-rubber">Borracha backhand</Label>
          <Input
            disabled={isPending}
            id="profile-backhand-rubber"
            maxLength={120}
            onChange={(event) =>
              updateValue("backhandRubberName", event.target.value)
            }
            placeholder="Ex: Rakza 7"
            value={values.backhandRubberName}
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="profile-equipment-notes">Observacoes</Label>
          <Textarea
            disabled={isPending}
            id="profile-equipment-notes"
            maxLength={500}
            onChange={(event) =>
              updateValue("equipmentNotes", event.target.value)
            }
            placeholder="Detalhes opcionais sobre seu material"
            value={values.equipmentNotes}
          />
        </div>
      </div>

      <Button
        className="justify-self-start"
        disabled={isPending || !hasChanges || normalizedValues.name.length < 2}
        type="submit"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        Salvar alteracoes
      </Button>
    </form>
  );
}
