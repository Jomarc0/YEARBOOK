import { FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Image, ImageBackground, StyleSheet, Text, View } from "react-native";
import { usePrivacyProtection } from "../hooks/usePrivacyProtection";

const nuLogo = require("../assets/images/NU_logo.png");
const nuBuilding = require("../assets/images/NU-building.jpg");

export default function PrivacyScreen() {
  const hidden = usePrivacyProtection();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: hidden ? 1 : 0,
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [hidden, opacity]);

  return (
    <Animated.View
      pointerEvents={hidden ? "auto" : "none"}
      style={[styles.overlay, { opacity }]}
    >
      <ImageBackground source={nuBuilding} resizeMode="cover" style={styles.background}>
        <View style={styles.photoWash} />
        <View style={styles.tint} />
        <View style={styles.goldBar} />

        <View style={styles.content}>
          <View style={styles.brandRow}>
            <Image source={nuLogo} style={styles.logo} resizeMode="contain" />
            <View>
              <Text style={styles.brand}>SINAG-BUGHAW</Text>
              <Text style={styles.school}>National University Lipa</Text>
            </View>
          </View>

          <View style={styles.iconHalo}>
            <View style={styles.iconCircle}>
              <FontAwesome name="lock" size={29} color="#1d2b4b" />
            </View>
          </View>

          <Text style={styles.message}>Content Hidden for Privacy Protection</Text>
          <Text style={styles.submessage}>
            Your NU yearbook and personal information are protected while this screen is inactive.
          </Text>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999999,
    elevation: 999999,
    backgroundColor: "#071633",
  },
  background: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  photoWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 22, 51, 0.78)",
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(29, 43, 75, 0.72)",
  },
  goldBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: "#fdb813",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    width: "88%",
    maxWidth: 430,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  logo: {
    width: 56,
    height: 56,
  },
  brand: {
    color: "#fdb813",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 3,
  },
  school: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 3,
  },
  iconHalo: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(253,184,19,0.45)",
    marginBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fdb813",
  },
  message: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    paddingHorizontal: 28,
  },
  submessage: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 9,
    maxWidth: 340,
    textAlign: "center",
  },
});
