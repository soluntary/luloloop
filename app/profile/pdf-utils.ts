import jsPDF from "jspdf"

export const generateParticipantsPDF = (event: any, participants: any[]) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("Teilnehmerliste", pageWidth / 2, 20, { align: "center" })

  // Event Info
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(event.title || "Event", pageWidth / 2, 32, { align: "center" })

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  let yPos = 45
  doc.text(`Standort: ${event.location || "-"}`, 20, yPos)
  yPos += 7

  if (event.first_instance_date) {
    const eventDate = new Date(event.first_instance_date).toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    doc.text(`Datum: ${eventDate}`, 20, yPos)
    yPos += 7
  }

  if (event.start_time) {
    doc.text(`Uhrzeit: ${event.start_time} Uhr`, 20, yPos)
    yPos += 7
  }

  doc.text(`Teilnehmer: ${participants.length}${event.max_participants ? ` / ${event.max_participants}` : ""}`, 20, yPos)
  yPos += 15

  // Separator line
  doc.setDrawColor(200, 200, 200)
  doc.line(20, yPos, pageWidth - 20, yPos)
  yPos += 10

  // Table header
  doc.setFont("helvetica", "bold")
  doc.text("Nr.", 20, yPos)
  doc.text("Name", 40, yPos)
  doc.text("E-Mail", 100, yPos)
  doc.text("Beigetreten am", 155, yPos)
  yPos += 3

  // Header underline
  doc.line(20, yPos, pageWidth - 20, yPos)
  yPos += 7

  // Participants list
  doc.setFont("helvetica", "normal")

  if (participants.length === 0) {
    doc.setTextColor(128, 128, 128)
    doc.text("Keine Teilnehmer angemeldet", pageWidth / 2, yPos, { align: "center" })
  } else {
    participants.forEach((p: any, index: number) => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }

      const profile = p.profiles || {}
      const name = profile.name || profile.username || "Unbekannt"
      const email = profile.email || "-"
      const joinedDate = p.joined_at
        ? new Date(p.joined_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "-"

      doc.text(`${index + 1}.`, 20, yPos)
      doc.text(name.substring(0, 30), 40, yPos)
      doc.text(email.substring(0, 30), 100, yPos)
      doc.text(joinedDate, 155, yPos)
      yPos += 7
    })
  }

  // Footer
  const today = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text(`Erstellt am ${today} via LudoLoop`, pageWidth / 2, 290, { align: "center" })

  // Download
  doc.save(`Teilnehmerliste_${event.title?.replace(/[^a-zA-Z0-9]/g, "_") || "Event"}.pdf`)
}

export const generateGroupMembersPDF = (community: any) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("Mitgliederliste", pageWidth / 2, 20, { align: "center" })

  // Group Info
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(community.name || "Spielgruppe", pageWidth / 2, 32, { align: "center" })

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  // Group Details
  let yPos = 45
  doc.text(`Ort: ${community.location || "-"}`, 20, yPos)
  yPos += 7

  const createdDate = new Date(community.created_at).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  doc.text(`Erstellt am: ${createdDate}`, 20, yPos)
  yPos += 7

  const members = community.community_members || []
  doc.text(`Anzahl Mitglieder: ${members.length}`, 20, yPos)
  yPos += 15

  // Separator line
  doc.setDrawColor(200, 200, 200)
  doc.line(20, yPos, pageWidth - 20, yPos)
  yPos += 10

  // Table header
  doc.setFont("helvetica", "bold")
  doc.text("Nr.", 20, yPos)
  doc.text("Name", 40, yPos)
  doc.text("E-Mail", 100, yPos)
  doc.text("Beigetreten am", 155, yPos)
  yPos += 3

  // Header underline
  doc.line(20, yPos, pageWidth - 20, yPos)
  yPos += 7

  // Members list
  doc.setFont("helvetica", "normal")

  if (members.length === 0) {
    doc.setTextColor(128, 128, 128)
    doc.text("Keine Mitglieder", pageWidth / 2, yPos, { align: "center" })
  } else {
    members.forEach((m: any, index: number) => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }

      const profile = m.profiles || {}
      const name = profile.name || profile.username || "Unbekannt"
      const email = profile.email || "-"
      const joinedDate = m.joined_at
        ? new Date(m.joined_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "-"

      doc.text(`${index + 1}.`, 20, yPos)
      doc.text(name.substring(0, 30), 40, yPos)
      doc.text(email.substring(0, 30), 100, yPos)
      doc.text(joinedDate, 155, yPos)
      yPos += 7
    })
  }

  // Footer
  const today = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text(`Erstellt am ${today} via LudoLoop`, pageWidth / 2, 290, { align: "center" })

  // Download
  doc.save(`Mitgliederliste_${community.name?.replace(/[^a-zA-Z0-9]/g, "_") || "Gruppe"}.pdf`)
}
