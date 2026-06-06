import { StyleSheet } from "react-native";

export const crudStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7fe",
  },
  header: {
    backgroundColor: "#1d2b4b",
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 22,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fdb813",
  },
  headerSubtitle: {
    marginTop: 4,
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8EBF4",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B2559",
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D8DEEA",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#172033",
    backgroundColor: "#FBFCFF",
    marginBottom: 12,
  },
  button: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: "#1d2b4b",
  },
  secondaryButton: {
    backgroundColor: "#EFF3FF",
  },
  dangerButton: {
    backgroundColor: "#FFE5E5",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  primaryButtonText: {
    color: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#1d2b4b",
  },
  dangerButtonText: {
    color: "#C62828",
  },
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E8EBF4",
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#172033",
    marginBottom: 4,
  },
  itemText: {
    fontSize: 14,
    color: "#5B6478",
    marginBottom: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
  },
  statusText: {
    marginTop: 10,
    fontSize: 14,
    color: "#1d2b4b",
  },
  errorText: {
    color: "#C62828",
  },
  emptyText: {
    textAlign: "center",
    color: "#6C7589",
    fontSize: 14,
  },
});
