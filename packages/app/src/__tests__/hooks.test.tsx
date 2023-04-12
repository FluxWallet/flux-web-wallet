import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMounted } from "../hooks/useIsMounted";
import { useIsDesktop } from "../hooks/useIsDesktop";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

describe("useIsMounted", () => {
  it("returns true after mount", () => {
    const { result } = renderHook(() => useIsMounted());
    expect(result.current.isMounted).toBe(true);
  });
});

describe("useIsDesktop", () => {
  it("reflects viewport match after mount", () => {
    const { result } = renderHook(() => useIsDesktop());
    expect(typeof result.current.isDesktop).toBe("boolean");
  });

  it("cleans up event listener on unmount", () => {
    const removeEventListener = vi.fn();
    (window.matchMedia as ReturnType<typeof vi.fn>).mockReturnValue({
      matches: false,
      media: "",
      addEventListener: vi.fn(),
      removeEventListener,
    });

    const { unmount } = renderHook(() => useIsDesktop());
    unmount();
    expect(removeEventListener).toHaveBeenCalledTimes(1);
  });
});
