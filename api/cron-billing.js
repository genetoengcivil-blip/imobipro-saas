export default async function handler(req, res) {
  // This endpoint is intended to be triggered by Vercel Cron
  // TODO: 1) check trial_end -> downgrade to basic
  // TODO: 2) check past_due -> send notifications 15/24/48h and block after 48h
  // TODO: 3) trigger backups
  return res.status(200).json({ ok: true, message: "Stub cron run" });
}
