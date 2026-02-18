import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/primitives/card";
import { ToggleGroup } from "@/components/ToggleGroup";
import { getStoredTheme, setTheme, type Theme } from "@/lib/theme";
import {
  getStoredDateFormat,
  getStoredTimeFormat,
  setStoredDateFormat,
  setStoredTimeFormat,
  type DateFormat,
  type TimeFormat,
} from "@/lib/dateTime";

const General: React.FC = () => {
  const [theme, setThemeState] = useState<Theme>(
    () => getStoredTheme() ?? "sky",
  );
  const [dateFormat, setDateFormat] = useState<DateFormat>(
    () => getStoredDateFormat(),
  );
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(
    () => getStoredTimeFormat(),
  );

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  useEffect(() => {
    setStoredDateFormat(dateFormat);
  }, [dateFormat]);

  useEffect(() => {
    setStoredTimeFormat(timeFormat);
  }, [timeFormat]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="space-y-4 text-sm text-muted">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-semibold text-text">Theme</p>
              <p className="text-sm text-muted">
                Sky/Light affect the main UI; Night also darkens the sidebar.
              </p>
            </div>
            <ToggleGroup
              value={theme}
              onValueChange={(val) => setThemeState(val as Theme)}
              options={[
                { value: "sky", label: "Sky" },
                { value: "light", label: "Light" },
                { value: "night", label: "Night" },
              ]}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-semibold text-text">Date format</p>
              <p className="text-sm text-muted">Choose how calendar dates are shown.</p>
            </div>
            <ToggleGroup
              value={dateFormat}
              onValueChange={(val) => setDateFormat(val as DateFormat)}
              options={[
                { value: "dd/mm/yyyy", label: "DD/MM/YYYY" },
                { value: "mm/dd/yyyy", label: "MM/DD/YYYY" },
                { value: "yyyy-mm-dd", label: "YYYY-MM-DD" },
              ]}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-semibold text-text">Time format</p>
              <p className="text-sm text-muted">Choose 24-hour or 12-hour clock.</p>
            </div>
            <ToggleGroup
              value={timeFormat}
              onValueChange={(val) => setTimeFormat(val as TimeFormat)}
              options={[
                { value: "24h", label: "24h" },
                { value: "12h", label: "12h" },
              ]}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default General;
