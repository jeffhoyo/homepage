import Block from "components/services/widget/block";
import Container from "components/services/widget/container";
import { useTranslation } from "next-i18next";

import useWidgetAPI from "utils/proxy/use-widget-api";

export default function Component({ service }) {
  const { t } = useTranslation();

  const { widget } = service;

  const { data: statsData, error: statsError } = useWidgetAPI(widget, "stat/sites");

  if (statsError) {
    return <Container service={service} error={statsError} />;
  }

  const defaultSite = widget.site
    ? statsData?.data.find((s) => s.desc === widget.site)
    : statsData?.data?.find((s) => s.name === "default");

  if (!defaultSite) {
    if (widget.site) {
      return <Container service={service} error={{ message: `Site '${widget.site}' not found` }} />;
    }

    return (
      <Container service={service}>
        <Block label="unifi.uptime" />
        <Block label="unifi.wan" />
        <Block label="unifi.lan_users" />
        <Block label="unifi.wlan_users" />
      </Container>
    );
  }

  const wan = defaultSite.health.find((h) => h.subsystem === "wan");
  const lan = defaultSite.health.find((h) => h.subsystem === "lan");
  const wlan = defaultSite.health.find((h) => h.subsystem === "wlan");
  [wan, lan, wlan].forEach((s) => {
    s.up = s.status === "ok"; // eslint-disable-line no-param-reassign
    s.show = s.status !== "unknown"; // eslint-disable-line no-param-reassign
  });

  const uptime = wan["gw_system-stats"]
    ? `${t("common.number", { value: wan["gw_system-stats"].uptime / 86400, maximumFractionDigits: 1 })} ${t(
        "unifi.days",
      )}`
    : null;

  // ✅ WAN-focused helpers
  const toKBps = (bytes) => (bytes / 1024).toFixed(1) + " KB/s";

  const wanStats = wan["uptime_stats"]?.WAN;
  const ping = wanStats?.latency_average ?? null;
  const availability = wanStats?.availability
    ? `${wanStats.availability.toFixed(2)}%`
    : null;

  const wanip = wan["wan_ip"];
  const numwlan = wlan["num_user"];
  const numlan = lan["num_user"];

  // Color rules for ping
  const getPingElement = (ping) => {
    let color = "green";
    if (ping >= 150) color = "red";
    else if (ping >= 50) color = "gold";

    return (
      <span>
        <span style={{ color }}>{ping}</span> ms
      </span>
    );
  };

  // WAN status with icon + color
  const statusElement = wan.up
    ? <span style={{ color: "green" }}>🟢 UP</span>
    : <span style={{ color: "red" }}>🔴 DOWN</span>;

  if (!(wan.show || lan.show || wlan.show || uptime)) {
    return (
      <Container service={service}>
        <Block value={t("unifi.empty_data")} />
      </Container>
    );
  }

  // FINAL RETURN - WAN Performance Focus
  return (
    <Container service={service}>
      <Block label="WAN Status" value={statusElement} />
      {uptime && <Block label="unifi.uptime" value={uptime} />}
      {ping && <Block label="Ping" value={getPingElement(ping)} />}
      {wanip && <Block label="WAN IP" value={wanip} />}
      <Block label="LAN USERS" value={numlan} />
      <Block label="WLAN USERS" value={numwlan} />
    </Container>
  );
}