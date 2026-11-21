import { useEffect } from "react";
import { useI18n } from "../i18n";

// Each page names itself in the tab: "<page> · Kadr"; the home page uses the full title.
export function usePageTitle(title?: string) {
  const { t } = useI18n();
  useEffect(() => {
    document.title = title ? `${title} · Kadr` : t.meta.title;
  }, [title, t]);
}
