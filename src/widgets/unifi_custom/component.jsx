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
        <Block label="unifi_custom.mem" />
        <Block label="unifi_custom.wan" />
        <Block label="unifi_custom.lan_users" />
        <Block label="unifi_custom.wlan_users" />
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

  // const uptime = wan["gw_system-stats"]
  //   ? `${t("common.number", { value: wan["gw_system-stats"].uptime / 86400, maximumFractionDigits: 1 })} ${t(
  //       "unifi.days",
  //     )}`
  //   : null;

  const mem = wan["gw_system-stats"]
  ? `${t("common.number", { value: wan["gw_system-stats"].mem, maximumFractionDigits: 1 })} ${t(
      "unifi_custom.mb",
    )}`
  : null;

  if (!(wan.show || lan.show || wlan.show || mem)) {
    return (
      <Container service={service}>
        <Block value={t("unifi_custom.empty_data")} />
      </Container>
    );
  }

  return (
    <Container service={service}>
      {mem && <Block label="unifi_custom.mem" value={mem} />}
      
      {wan.show && <Block label="unifi_custom.wan" value={wan.status === "ok" ? t("unifi_custom.up") : t("unifi_custom.down")} />}

      {lan.show && <Block label="unifi_custom.lan_users" value={t("common.number", { value: lan.num_user })} />}
      {lan.show && !wlan.show && (
        <Block label="unifi_custom.lan_devices" value={t("common.number", { value: lan.num_adopted })} />
      )}

      {lan.show && !wlan.show && <Block label="unifi_custom.lan" value={lan.up ? t("unifi_custom.up") : t("unifi_custom.down")} />}
      {wlan.show && <Block label="unifi_custom.wlan_users" value={t("common.number", { value: wlan.num_user })} />}

      {wlan.show && !lan.show && (
        <Block label="unifi_custom.wlan_devices" value={t("common.number", { value: wlan.num_adopted })} />
      )}
      {wlan.show && !lan.show && <Block label="unifi_custom.wlan" value={wlan.up ? t("unifi_custom.up") : t("unifi_custom.down")} />}
    </Container>
  );
}
