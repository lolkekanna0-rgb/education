import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

type SupportContacts = {
  telegram: string;
  whatsapp: string;
};

const DEFAULT_CONTACTS: SupportContacts = {
  telegram: "https://t.me/asiacapit",
  whatsapp: "https://wa.me/+996222177711",
};

const STORAGE_PATH = path.join(process.cwd(), "support-contacts.json");

const readContacts = async (): Promise<SupportContacts> => {
  try {
    const content = await fs.readFile(STORAGE_PATH, "utf-8");
    const parsed = JSON.parse(content) as Partial<SupportContacts>;
    return {
      telegram: parsed.telegram || DEFAULT_CONTACTS.telegram,
      whatsapp: parsed.whatsapp || DEFAULT_CONTACTS.whatsapp,
    };
  } catch {
    return DEFAULT_CONTACTS;
  }
};

const writeContacts = async (data: SupportContacts) => {
  await fs.writeFile(STORAGE_PATH, JSON.stringify(data, null, 2), "utf-8");
};

export async function GET() {
  const data = await readContacts();
  return NextResponse.json({ success: true, data }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Partial<SupportContacts>;
    const telegram = typeof payload.telegram === "string" ? payload.telegram.trim() : "";
    const whatsapp = typeof payload.whatsapp === "string" ? payload.whatsapp.trim() : "";

    if (!telegram && !whatsapp) {
      return NextResponse.json({ success: false, error: "Заполните хотя бы одно поле." }, { status: 400 });
    }

    const data: SupportContacts = {
      telegram: telegram || DEFAULT_CONTACTS.telegram,
      whatsapp: whatsapp || DEFAULT_CONTACTS.whatsapp,
    };

    await writeContacts(data);

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
