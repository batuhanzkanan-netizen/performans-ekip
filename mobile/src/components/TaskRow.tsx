import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getState, useStore } from "../data/store";
import * as api from "../data/service";
import {
  firstLink,
  isLate,
  localDate,
  priorityNames,
  validDate,
} from "../domain/model";
import type { Task } from "../domain/model";
import {
  Button,
  Choices,
  colors,
  fonts,
  IconButton,
  Label,
  Sheet,
  styles,
} from "./ui";
function InlineField({
  task,
  field,
  editable,
}: {
  task: Task;
  field: "title" | "note";
  editable: boolean;
}) {
  const value = task[field];
  const [draft, setDraft] = useState<string | null>(null),
    dirty = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    original = useRef(value);
  useEffect(() => {
    if (!editable) {
      if (timer.current) clearTimeout(timer.current);
      dirty.current = false;
    }
  }, [editable]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const save = (next = draft ?? value) => {
    if (timer.current) clearTimeout(timer.current);
    if (!dirty.current || !getState().editor) return;
    const clean = field === "title" ? next.trim() : next;
    if (field === "title" && !clean) {
      setDraft(null);
      dirty.current = false;
      return;
    }
    dirty.current = false;
    original.current = clean;
    void api.patchTask(task.id, { [field]: clean }).catch(api.reportError);
  };
  return (
    <TextInput
      accessibilityLabel={field === "title" ? "Görev başlığı" : "Görev notu"}
      editable={editable}
      multiline
      submitBehavior={field === "title" ? "blurAndSubmit" : "newline"}
      value={editable ? (draft ?? value) : value}
      maxLength={field === "title" ? 199 : 5000}
      placeholder={field === "note" ? "Not ekle…" : ""}
      placeholderTextColor="#9B9991"
      onFocus={() => {
        original.current = value;
        setDraft(value);
      }}
      onChangeText={(next) => {
        setDraft(next);
        dirty.current = true;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => save(next), 1200);
      }}
      onBlur={() => {
        save();
        setDraft(null);
      }}
      onSubmitEditing={() => {
        if (field === "title") save();
      }}
      onKeyPress={(e) => {
        if (e.nativeEvent.key === "Escape") {
          if (timer.current) clearTimeout(timer.current);
          dirty.current = false;
          setDraft(original.current);
        }
      }}
      style={{
        flex: 1,
        fontFamily: field === "title" ? fonts.bold : fonts.body,
        fontSize: 16,
        color:
          field === "note" ? colors.muted : task.done ? "#92918A" : colors.text,
        textDecorationLine:
          field === "title" && task.done ? "line-through" : "none",
        paddingVertical: 10,
        minHeight: 44,
        textAlignVertical: "top",
      }}
    />
  );
}
export function TaskRow({ task, overview }: { task: Task; overview: boolean }) {
  const s = useStore(),
    [menu, setMenu] = useState<"trainer" | "priority" | "date" | null>(null),
    [dateText, setDateText] = useState(task.due || "");
  const trainer = s.trainers.find((t) => t.id === task.trainerId),
    link = firstLink(task.note),
    priorityColor =
      task.priority === 3
        ? ["#FDDDD0", "#C0390B"]
        : task.priority === 2
          ? ["#FBEFC4", "#86650A"]
          : ["#EEEEEC", "#5C5B57"];
  const update = (patch: Partial<Task>) => {
    void api.patchTask(task.id, patch).catch(api.reportError);
  };
  const remove = () =>
    Alert.alert("Görevi sil?", task.title, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          void api.removeTask(task.id).catch(api.reportError);
        },
      },
    ]);
  return (
    <View
      style={{
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: colors.line,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <IconButton
          name={task.done ? "checkbox" : "square-outline"}
          label={task.done ? "Görevi yeniden aç" : "Görevi tamamla"}
          color={task.done ? colors.orange : "#B8B7AF"}
          disabled={!s.editor}
          onPress={() =>
            update({ done: !task.done, doneAt: !task.done ? Date.now() : null })
          }
        />
        <InlineField task={task} field="title" editable={s.editor} />
        {s.editor && (
          <IconButton
            name="trash-outline"
            label="Görevi sil"
            onPress={remove}
          />
        )}
      </View>
      <View style={{ marginLeft: 44, opacity: task.done ? 0.55 : 1 }}>
        <View
          style={{
            flexDirection: "row",
            gap: 7,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {overview && (
            <Pressable
              accessibilityRole={s.editor ? "button" : undefined}
              accessibilityLabel="Eğitmeni değiştir"
              disabled={!s.editor}
              onPress={() => setMenu("trainer")}
              style={styles.chip}
            >
              <Label style={{ fontSize: 12 }}>
                {trainer?.name || "Eğitmen kaldırıldı"}
              </Label>
            </Pressable>
          )}
          <Pressable
            accessibilityRole={s.editor ? "button" : undefined}
            disabled={!s.editor}
            onPress={() => setMenu("priority")}
            style={[styles.chip, { backgroundColor: priorityColor[0] }]}
          >
            <Label style={{ fontSize: 12, color: priorityColor[1] }}>
              {priorityNames[task.priority]}
            </Label>
          </Pressable>
          <Pressable
            accessibilityRole={s.editor ? "button" : undefined}
            disabled={!s.editor}
            onPress={() => {
              setDateText(task.due || "");
              setMenu("date");
            }}
            style={styles.chip}
          >
            <Label
              style={{
                fontSize: 12,
                color: isLate(task) ? colors.red : colors.muted,
                fontFamily: isLate(task) ? fonts.bold : fonts.body,
              }}
            >
              {task.due
                ? new Date(`${task.due}T12:00:00`).toLocaleDateString("tr-TR")
                : "Tarih ekle"}
            </Label>
          </Pressable>
        </View>
        <View style={styles.row}>
          <InlineField task={task} field="note" editable={s.editor} />
          {link && (
            <IconButton
              name="open-outline"
              label="Nottaki bağlantıyı aç"
              color={colors.darkOrange}
              onPress={() => {
                void Linking.openURL(link).catch(api.reportError);
              }}
            />
          )}
        </View>
      </View>
      {menu === "trainer" && (
        <Choices
          title="Görevi aktar"
          value={task.trainerId}
          options={s.trainers
            .filter((t) => !t.deleting)
            .map((t) => ({ label: t.name, value: t.id }))}
          onChange={(id) => update({ trainerId: id })}
          onClose={() => setMenu(null)}
        />
      )}{" "}
      {menu === "priority" && (
        <Choices
          title="Önem"
          value={String(task.priority)}
          options={Object.entries(priorityNames).map(([value, label]) => ({
            value,
            label,
          }))}
          onChange={(v) => update({ priority: Number(v) as Task["priority"] })}
          onClose={() => setMenu(null)}
        />
      )}{" "}
      {menu === "date" && (
        <Sheet visible title="Bitiş tarihi" onClose={() => setMenu(null)}>
          {Platform.OS === "web" ? (
            <TextInput
              accessibilityLabel="Bitiş tarihi, YYYY-AA-GG"
              placeholder="2026-11-20"
              value={dateText}
              onChangeText={setDateText}
              style={styles.input}
            />
          ) : (
            <DateTimePicker
              value={
                dateText && validDate(dateText)
                  ? new Date(`${dateText}T12:00:00`)
                  : new Date()
              }
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, date) => {
                if (event.type === "dismissed") {
                  setMenu(null);
                  return;
                }
                if (date) {
                  const due = localDate(date);
                  setDateText(due);
                  if (Platform.OS === "android") {
                    update({ due });
                    setMenu(null);
                  }
                }
              }}
            />
          )}
          <View style={styles.actions}>
            <Button
              title="Tarihi kaldır"
              onPress={() => {
                update({ due: null });
                setMenu(null);
              }}
            />
            <Button
              title="Kaydet"
              kind="primary"
              onPress={() => {
                const due = dateText || localDate();
                if (!validDate(due)) {
                  api.reportError(
                    new Error("Tarihi YYYY-AA-GG biçiminde yaz."),
                  );
                  return;
                }
                update({ due });
                setMenu(null);
              }}
            />
          </View>
        </Sheet>
      )}
    </View>
  );
}
