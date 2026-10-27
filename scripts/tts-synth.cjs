/*
 * Run Edge Read Aloud in a child process so Next.js never bundles the
 * WebSocket client. The route writes escaped text to stdin and receives MP3
 * bytes on stdout.
 */
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});

process.stdin.on("error", (error) => {
  process.stderr.write(`stdin: ${error.message}\n`);
  process.exit(1);
});

process.stdin.on("end", async () => {
  const tts = new MsEdgeTTS({
    connectionTimeoutMs: 15_000,
    synthesisTimeoutMs: 60_000,
  });

  try {
    await tts.setMetadata(
      process.env.ASSISTANT_TTS_VOICE?.trim() || "zh-CN-XiaoyiNeural",
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
    );

    const { audioStream } = await tts.toStream(input);
    const chunks = [];
    await new Promise((resolve, reject) => {
      audioStream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      audioStream.on("end", resolve);
      audioStream.on("close", resolve);
      audioStream.on("error", reject);
    });

    const audio = Buffer.concat(chunks);
    if (!audio.length) {
      process.stderr.write("no audio returned\n");
      process.exit(1);
    }

    process.stdout.write(audio);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  } finally {
    tts.close();
  }
});
