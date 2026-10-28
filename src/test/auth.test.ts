import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  authConfigurada,
  credencialesValidas,
  crearSesion,
  destinoSeguro,
  esRutaPublica,
  verificarSesion,
} from "@/lib/auth";

describe("acceso con usuario y contraseña", () => {
  beforeEach(() => {
    vi.stubEnv("HUB_USUARIO", "petropar");
    vi.stubEnv("HUB_CLAVE", "Clave-de-prueba");
    vi.stubEnv("HUB_SECRETO", "secreto-de-prueba");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("valida credenciales", async () => {
    expect(authConfigurada()).toBe(true);
    expect(await credencialesValidas("petropar", "Clave-de-prueba")).toBe(true);
    expect(await credencialesValidas("petropar", "otra")).toBe(false);
    expect(await credencialesValidas("otro", "Clave-de-prueba")).toBe(false);
  });

  it("firma y verifica la sesión, y rechaza cookies adulteradas", async () => {
    const token = await crearSesion("petropar");
    expect(await verificarSesion(`otra=1; hub_sesion=${token}`)).toBe("petropar");
    const [datos] = token.split(".");
    const falsa = btoa(JSON.stringify({ u: "intruso", exp: 9999999999 }));
    expect(await verificarSesion(`hub_sesion=${falsa}.${token.split(".")[1]}`)).toBeNull();
    expect(await verificarSesion(`hub_sesion=${datos}.firmaInventada`)).toBeNull();
    expect(await verificarSesion(null)).toBeNull();
  });

  it("vence a los 7 días y se invalida si cambia el secreto", async () => {
    const token = await crearSesion("petropar");
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 8 * 24 * 3600 * 1000);
    expect(await verificarSesion(`hub_sesion=${token}`)).toBeNull();
    vi.useRealTimers();
    vi.stubEnv("HUB_SECRETO", "otro-secreto");
    expect(await verificarSesion(`hub_sesion=${token}`)).toBeNull();
  });

  it("sin variables el Hub queda abierto y no acepta credenciales", async () => {
    vi.stubEnv("HUB_USUARIO", "");
    vi.stubEnv("HUB_CLAVE", "");
    expect(authConfigurada()).toBe(false);
    expect(await credencialesValidas("", "")).toBe(false);
  });

  it("solo redirige a rutas internas", () => {
    expect(destinoSeguro("/comercial?tab=forecast")).toBe("/comercial?tab=forecast");
    expect(destinoSeguro("https://sitio-malicioso.com")).toBe("/");
    expect(destinoSeguro("//sitio-malicioso.com")).toBe("/");
    expect(esRutaPublica("/api/salud")).toBe(true);
    expect(esRutaPublica("/api/chat")).toBe(false);
  });
});
