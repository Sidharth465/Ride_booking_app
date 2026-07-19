import React, { useEffect, useRef, useState } from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/shared/CustomText";
import { useWS } from "@/service/WSProvider";
import { AppColors } from "@/utils/Constants";
import { useColors } from "@/theme/ThemeProvider";
import { useThemedStyles } from "@/theme/useThemedStyles";
import {
  RFValue,
  scaleHorizontal,
  scaleModerate,
  scaleVertical,
} from "@/utils/responsive";

export type ChatMessage = {
  _id?: string;
  sender: string;
  role: "customer" | "rider";
  text: string;
  createdAt?: string | Date;
};

type RideChatScreenProps = {
  rideIdProp?: string;
  myRole: "customer" | "rider";
  peerLabel: string;
};

const RideChatScreen = ({
  rideIdProp,
  myRole,
  peerLabel,
}: RideChatScreenProps) => {
  const params = useLocalSearchParams<{ rideId?: string }>();
  const rideId = String(params.rideId || rideIdProp || "");
  const { emit, on, off, isConnected } = useWS();
  const colors = useColors();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);

  const myRoleRef = useRef(myRole);
  myRoleRef.current = myRole;

  const styles = useThemedStyles((c: AppColors) => ({
    root: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: scaleHorizontal(16),
      paddingVertical: scaleVertical(12),
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    title: { fontSize: RFValue(14), color: c.text },
    center: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    list: {
      paddingHorizontal: scaleHorizontal(16),
      paddingTop: scaleVertical(16),
      paddingBottom: scaleVertical(24),
      flexGrow: 1,
    },
    empty: {
      textAlign: "center" as const,
      color: c.muted,
      marginTop: scaleVertical(40),
    },
    bubbleRow: { marginBottom: scaleVertical(10), maxWidth: "82%" as const },
    mineRow: { alignSelf: "flex-end" as const },
    theirsRow: { alignSelf: "flex-start" as const },
    bubble: {
      borderRadius: scaleModerate(16),
      paddingHorizontal: scaleHorizontal(12),
      paddingVertical: scaleVertical(8),
    },
    mine: {
      backgroundColor: c.primary,
      borderBottomRightRadius: scaleModerate(4),
    },
    theirs: {
      backgroundColor: c.secondary,
      borderBottomLeftRadius: scaleModerate(4),
    },
    composer: {
      flexDirection: "row" as const,
      alignItems: "flex-end" as const,
      gap: scaleHorizontal(8),
      paddingHorizontal: scaleHorizontal(12),
      paddingTop: scaleVertical(10),
      paddingBottom:
        Platform.OS === "ios" ? scaleVertical(10) : scaleVertical(12),
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.surface,
    },
    input: {
      flex: 1,
      maxHeight: scaleVertical(100),
      minHeight: scaleVertical(42),
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: scaleModerate(20),
      paddingHorizontal: scaleHorizontal(14),
      paddingVertical:
        Platform.OS === "ios" ? scaleVertical(10) : scaleVertical(8),
      fontSize: RFValue(12),
      color: c.text,
      backgroundColor: c.secondary_light,
    },
    sendBtn: {
      width: scaleModerate(42),
      height: scaleModerate(42),
      borderRadius: scaleModerate(21),
      backgroundColor: c.primary,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
  }));

  useEffect(() => {
    if (!rideId) {
      setLoading(false);
      return;
    }

    emit("subscribeRide", rideId);
    emit("getChatHistory", rideId);

    const onHistory = (payload: {
      rideId?: string;
      messages?: ChatMessage[];
    }) => {
      if (payload?.rideId && String(payload.rideId) !== rideId) return;
      setMessages(payload?.messages || []);
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
    };

    const onMessage = (payload: {
      rideId?: string;
      message?: ChatMessage;
    }) => {
      if (!payload?.message) return;
      if (payload.rideId && String(payload.rideId) !== rideId) return;
      setMessages((prev) => {
        const id = payload.message?._id;
        if (id && prev.some((m) => m._id === id)) return prev;
        return [...prev, payload.message!];
      });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    };

    on("chatHistory", onHistory);
    on("chatMessage", onMessage);

    const wait = setInterval(() => {
      if (isConnected()) {
        emit("getChatHistory", rideId);
        clearInterval(wait);
      }
    }, 500);

    return () => {
      clearInterval(wait);
      off("chatHistory", onHistory);
      off("chatMessage", onMessage);
    };
  }, [rideId]);

  // Keep composer visible: scroll list when keyboard opens
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
      }
    );
    return () => show.remove();
  }, []);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || !rideId) return;
    emit("sendChatMessage", { rideId, text: trimmed });
    setText("");
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = item.role === myRoleRef.current;
    return (
      <View style={[styles.bubbleRow, mine ? styles.mineRow : styles.theirsRow]}>
        <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
          <CustomText
            fontSize={12}
            style={{ color: mine ? colors.onPrimary : colors.text }}
          >
            {item.text}
          </CustomText>
          <CustomText
            fontSize={9}
            style={{
              color: mine ? "rgba(255,255,255,0.7)" : colors.muted,
              marginTop: scaleVertical(4),
              alignSelf: "flex-end",
            }}
          >
            {item.createdAt
              ? new Date(item.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </CustomText>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={RFValue(22)} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: scaleHorizontal(12) }}>
            <CustomText fontFamily="Bold" style={styles.title}>
              Chat with {peerLabel}
            </CustomText>
            <CustomText fontSize={10} style={{ color: colors.muted }}>
              In-trip messages
            </CustomText>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            style={styles.flex}
            data={messages}
            keyExtractor={(item, i) => item._id || `${item.createdAt}-${i}`}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            ListEmptyComponent={
              <CustomText style={styles.empty}>
                Say hi — messages stay with this ride.
              </CustomText>
            }
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={`Message ${peerLabel.toLowerCase()}…`}
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]}
            onPress={send}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={RFValue(18)} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RideChatScreen;
