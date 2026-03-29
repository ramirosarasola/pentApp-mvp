import { colors, spacing } from "@/app/constants/theme"
import { useEffect, useRef } from "react"
import { Animated, StyleSheet, View } from "react-native"

const DOT_COUNT = 3
const ANIMATION_DELAY_MS = 180
const ANIMATION_DURATION_MS = 500

export function ChatTypingIndicator() {
  const dots = useRef(
    Array.from({ length: DOT_COUNT }, () => new Animated.Value(0.3))
  ).current

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * ANIMATION_DELAY_MS),
          Animated.timing(dot, {
            toValue: 1,
            duration: ANIMATION_DURATION_MS,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: ANIMATION_DURATION_MS,
            useNativeDriver: true,
          }),
        ])
      )
    )
    animations.forEach((a) => a.start())
    return () => animations.forEach((a) => a.stop())
  }, [dots])

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <View style={styles.avatarDot} />
      </View>
      <View style={styles.bubble}>
        {dots.map((opacity, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity }]} />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing[4],
    marginVertical: spacing[1],
    gap: spacing[2],
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(0, 218, 243, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(0, 218, 243, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.tertiary,
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(0, 218, 243, 0.35)",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2] + 2,
    minHeight: 40,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.tertiary,
  },
})
