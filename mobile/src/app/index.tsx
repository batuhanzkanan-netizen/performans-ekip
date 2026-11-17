import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getState, setState, useStore } from "../data/store";
import * as api from "../data/service";
import { isLate, priorityNames, selectTasks } from "../domain/model";
import { TaskRow } from "../components/TaskRow";
import {
  Button,
  Choices,
  colors,
  fonts,
  IconButton,
  Label,
  NameDialog,
  styles,
} from "../components/ui";
export default function Tasks() {
  const s = useStore(),
    [savedTab, setTab] = useState("all"),
    [sort, setSort] = useState("added"),
    [trainerFilter, setTrainerFilter] = useState("all"),
    [priorityFilter, setPriorityFilter] = useState("all"),
    [menu, setMenu] = useState<
      "sort" | "trainer" | "priority" | "new-trainer" | null
    >(null),
    [trainerDialog, setTrainerDialog] = useState<string | null>(null),
    [title, setTitle] = useState(""),
    [newTrainer, setNewTrainer] = useState("");
  useEffect(() => {
    let live = true;
    void AsyncStorage.getItem("pa-tab").then((v) => {
      if (live && v) setTab(v);
    });
    return () => {
      live = false;
    };
  }, []);
  const tab =
    s.loaded && savedTab !== "all" && !s.trainers.some((t) => t.id === savedTab)
      ? "all"
      : savedTab;
  const switchTab = (id: string) => {
    setTab(id);
    void AsyncStorage.setItem("pa-tab", id).catch(api.reportError);
  };
  const active = s.trainers.find((t) => t.id === tab),
    all = s.tasks.filter((t) => tab === "all" || t.trainerId === tab),
    tasks = useMemo(
      () => selectTasks(s.tasks, tab, sort, trainerFilter, priorityFilter),
      [s.tasks, tab, sort, trainerFilter, priorityFilter],
    );
  const trainer = s.trainers.find((t) => t.id === trainerDialog),
    available = s.trainers.filter((t) => !t.deleting),
    selectedTrainer =
      available.find((t) => t.id === newTrainer)?.id || available[0]?.id || "";
  const status = !s.online
    ? "Çevrimdışı"
    : s.demo
      ? "Bu cihazdaki örnek veriler"
      : s.pending
        ? "Kaydediliyor…"
        : !s.loaded || s.cached
          ? "Bağlanıyor…"
          : "Tüm değişiklikler kaydedildi · canlı";
  const run = (fn: () => Promise<unknown>) => {
    void fn().catch(api.reportError);
  };
  const add = () => {
    if (!title.trim()) return;
    if (!selectedTrainer && tab === "all") return;
    run(() => api.addTask(title, tab === "all" ? selectedTrainer : tab));
    setTitle("");
  };
  const deleteTrainer = () => {
    if (!trainer) return;
    const id = trainer.id;
    Alert.alert(
      "Eğitmeni sil?",
      `${trainer.name} ve bu eğitmene ait ${getState().tasks.filter((t) => t.trainerId === id).length} görev birlikte silinecek.`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Görevleriyle sil",
          style: "destructive",
          onPress: () => {
            setTrainerDialog(null);
            run(() => api.removeTrainer(id));
          },
        },
      ],
    );
  };
  const header = (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingTop: 20,
          alignItems: "center",
        }}
      >
        <View>
          <Label style={styles.brand}>PERFORMANS ACADEMY</Label>
          <Text style={[styles.heading, { fontSize: 36, marginTop: 7 }]}>
            Ekip Görev Takibi
          </Text>
        </View>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.pale,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Label style={{ color: colors.darkOrange, fontFamily: fonts.bold }}>
            {(s.user?.name || s.user?.email || "P")[0]}
          </Label>
        </View>
      </View>
      <View style={[styles.row, { paddingVertical: 18 }]}>
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: s.online ? "#75917B" : colors.orange,
          }}
        />
        <Label
          accessibilityLiveRegion="polite"
          style={{ fontSize: 10, color: colors.muted }}
        >
          {status}
        </Label>
      </View>
      {(s.demo || !s.online || !s.editor) && (
        <View style={styles.banner}>
          <Label style={{ fontSize: 12, lineHeight: 19 }}>
            {s.demo
              ? "Önizleme · Yalnız bu cihazda kaydedilir. Ekip verileriyle bağlantısı yok."
              : !s.online
                ? "Son veriler gösteriliyor. Değişiklikler internet gelince kaydedilir."
                : "Yalnız görüntüleme · Düzenleme için ekip yöneticisine ulaş."}
          </Label>
        </View>
      )}
      {!!s.error && (
        <View style={styles.banner}>
          <Label style={{ fontSize: 12, lineHeight: 20 }}>{s.error}</Label>
          <Button title="Kapat" onPress={() => setState({ error: "" })} />
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ borderBottomWidth: 1, borderColor: "#E2E1DE", marginTop: 10 }}
        contentContainerStyle={{ gap: 20 }}
      >
        {[{ id: "all", name: "Genel Bakış" }, ...s.trainers].map((t) => (
          <View
            key={t.id}
            style={{
              flexDirection: "row",
              borderBottomWidth: 2,
              borderColor: tab === t.id ? colors.orange : "transparent",
              alignItems: "center",
            }}
          >
            <Pressable
              onPress={() => switchTab(t.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t.id }}
              style={[styles.row, { minHeight: 52, paddingHorizontal: 2 }]}
            >
              <Label
                style={{
                  fontSize: 13,
                  color: tab === t.id ? colors.darkOrange : colors.text,
                }}
              >
                {t.name}
              </Label>
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 3,
                  backgroundColor: tab === t.id ? colors.pale : colors.hover,
                  borderRadius: 4,
                }}
              >
                <Label style={{ fontSize: 10 }}>
                  {
                    s.tasks.filter(
                      (x) =>
                        !x.done && (t.id === "all" || x.trainerId === t.id),
                    ).length
                  }
                </Label>
              </View>
            </Pressable>
            {s.editor && t.id === tab && t.id !== "all" && (
              <IconButton
                name="pencil-outline"
                label="Eğitmeni düzenle"
                onPress={() => setTrainerDialog(t.id)}
              />
            )}
          </View>
        ))}
        {s.editor && (
          <IconButton
            name="add"
            label="Eğitmen ekle"
            color={colors.orange}
            onPress={() => setTrainerDialog("new")}
          />
        )}
      </ScrollView>
      <View style={{ paddingVertical: 26, gap: 10 }}>
        <Label style={{ fontSize: 9, letterSpacing: 1.5, color: colors.muted }}>
          EKİP ÇALIŞMA ALANI
        </Label>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <Text style={[styles.heading, { flex: 1 }]}>
            {active?.name || "Genel Bakış"}
          </Text>
          <Pressable onPress={() => setMenu("sort")} style={styles.chip}>
            <Label style={{ fontSize: 12 }}>
              {{ added: "Eklenme", priority: "Önem", due: "Tarih" }[sort]} ⌄
            </Label>
          </Pressable>
        </View>
        <Label style={styles.muted}>
          {all.filter((t) => !t.done).length} açık ·{" "}
          {all.filter((t) => t.done).length} tamamlandı ·{" "}
          {all.filter(isLate).length} gecikmiş
        </Label>
      </View>
      {tab === "all" && (
        <View style={[styles.row, { paddingBottom: 18, flexWrap: "wrap" }]}>
          <Pressable style={styles.chip} onPress={() => setMenu("trainer")}>
            <Label style={{ fontSize: 12 }}>
              {s.trainers.find((t) => t.id === trainerFilter)?.name ||
                "Tüm eğitmenler"}{" "}
              ⌄
            </Label>
          </Pressable>
          <Pressable style={styles.chip} onPress={() => setMenu("priority")}>
            <Label style={{ fontSize: 12 }}>
              {priorityNames[Number(priorityFilter) as 1 | 2 | 3] ||
                "Tüm önemler"}{" "}
              ⌄
            </Label>
          </Pressable>
        </View>
      )}
    </View>
  );
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.page}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          data={tasks}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 30,
            maxWidth: 1000,
            width: "100%",
            alignSelf: "center",
          }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
          renderItem={({ item }) => (
            <TaskRow task={item} overview={tab === "all"} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Label style={styles.muted}>
                {!s.loaded
                  ? "Görevler yükleniyor…"
                  : !s.trainers.length
                    ? "Üstteki + ile ilk eğitmeni ekle"
                    : "Bu filtrelere uyan görev yok"}
              </Label>
            </View>
          }
          ListFooterComponent={
            <View>
              {s.editor && available.length > 0 && (
                <View
                  style={{
                    paddingVertical: 18,
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: colors.line,
                    gap: 10,
                  }}
                >
                  <View style={styles.row}>
                    <IconButton
                      name="add"
                      label="Yeni görevi ekle"
                      color={colors.orange}
                      onPress={add}
                    />
                    <TextInput
                      accessibilityLabel="Yeni görev başlığı"
                      placeholder="Yeni görev · yaz ve Enter’a bas"
                      placeholderTextColor={colors.muted}
                      value={title}
                      onChangeText={setTitle}
                      maxLength={199}
                      style={{
                        flex: 1,
                        fontSize: 16,
                        fontFamily: fonts.body,
                        minHeight: 48,
                      }}
                      returnKeyType="done"
                      onSubmitEditing={add}
                    />
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      gap: 10,
                    }}
                  >
                    {tab === "all" && (
                      <Button
                        title={
                          available.find((t) => t.id === selectedTrainer)
                            ?.name || "Eğitmen seç"
                        }
                        onPress={() => setMenu("new-trainer")}
                      />
                    )}
                    <Button
                      title="Ekle"
                      kind="primary"
                      onPress={add}
                      disabled={!title.trim()}
                    />
                  </View>
                </View>
              )}
              <Label style={[styles.muted, { fontSize: 10, paddingTop: 24 }]}>
                Birlikte planla. Birlikte ilerle.
              </Label>
            </View>
          }
        />
      </KeyboardAvoidingView>
      {menu && (
        <Choices
          title={
            menu === "sort"
              ? "Sıralama"
              : menu === "priority"
                ? "Önem"
                : "Eğitmen"
          }
          value={
            menu === "sort"
              ? sort
              : menu === "priority"
                ? priorityFilter
                : menu === "new-trainer"
                  ? selectedTrainer
                  : trainerFilter
          }
          options={
            menu === "sort"
              ? [
                  { value: "added", label: "Eklenme" },
                  { value: "priority", label: "Önem" },
                  { value: "due", label: "Tarih" },
                ]
              : menu === "priority"
                ? [
                    { value: "all", label: "Tüm önemler" },
                    ...Object.entries(priorityNames).map(([value, label]) => ({
                      value,
                      label,
                    })),
                  ]
                : [
                    ...(menu === "trainer"
                      ? [{ value: "all", label: "Tüm eğitmenler" }]
                      : []),
                    ...available.map((t) => ({ value: t.id, label: t.name })),
                  ]
          }
          onChange={(v) => {
            if (menu === "sort") setSort(v);
            else if (menu === "priority") setPriorityFilter(v);
            else if (menu === "new-trainer") setNewTrainer(v);
            else setTrainerFilter(v);
          }}
          onClose={() => setMenu(null)}
        />
      )}{" "}
      {trainerDialog && (
        <NameDialog
          key={trainerDialog}
          title={trainerDialog === "new" ? "Eğitmen ekle" : "Eğitmeni düzenle"}
          initial={trainer?.name}
          onSave={(name) => {
            setTrainerDialog(null);
            run(() =>
              trainer
                ? api.renameTrainer(trainer.id, name)
                : api.addTrainer(name),
            );
          }}
          onClose={() => setTrainerDialog(null)}
          onDelete={trainer ? deleteTrainer : undefined}
        />
      )}
    </SafeAreaView>
  );
}
