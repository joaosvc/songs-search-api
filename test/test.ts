const signatureCipher = `s=zzJfuJfQdSswRQIhAOWVakdnZIAWXejHMbHt5YFm8sLVuZj1SzcRRzMa3mGmAiBHavXRoWrIQ9e9Yr-fC_pPVROog3mf683tcRKyGXEj%3DA%3Dv&sp=sig&url=https://rr2---sn-hvcuxaxjvh-4vgs.googlevideo.com/videoplayback%3Fexpire%3D1724622141%26ei%3D3VDLZtypNpqX-LAP1anVgQ0%26ip%3D177.190.211.187%26id%3Do-AMvndONmIOMk7p5DrJNejyo1Pl-vmSCpxXQfEt3GmYtU%26itag%3D251%26source%3Dyoutube%26requiressl%3Dyes%26xpc%3DEgVo2aDSNQ%253D%253D%26mh%3Dh5%26mm%3D31%252C29%26mn%3Dsn-hvcuxaxjvh-4vgs%252Csn-pmcg-4vgl%26ms%3Dau%252Crdu%26mv%3Dm%26mvi%3D2%26pl%3D26%26gcr%3Dbr%26initcwndbps%3D1151250%26bui%3DAQmm2ewRJaOU3BKTcxCaIH1mOKR8VnKNGvxgkVNQ0e3sl4uIEwsvUTQrbSZfNuT-Tadxs17LoKqEVSuY%26spc%3DMv1m9kXetCnHYZVXjYo7-Lj8GOTROHVtAExIoSlGW43z0C287L4eTO9gXci0%26vprv%3D1%26svpuc%3D1%26mime%3Daudio%252Fwebm%26ns%3Dg7lpZT99-Vu2PXKSigh7VDYQ%26rqh%3D1%26gir%3Dyes%26clen%3D2759421%26dur%3D160.821%26lmt%3D1714909872881718%26mt%3D1724600219%26fvip%3D2%26keepalive%3Dyes%26c%3DWEB_REMIX%26sefc%3D1%26txp%3D4432434%26n%3DkOgvvKjcuvHgYazo%26sparams%3Dexpire%252Cei%252Cip%252Cid%252Citag%252Csource%252Crequiressl%252Cxpc%252Cgcr%252Cbui%252Cspc%252Cvprv%252Csvpuc%252Cmime%252Cns%252Crqh%252Cgir%252Cclen%252Cdur%252Clmt%26lsparams%3Dmh%252Cmm%252Cmn%252Cms%252Cmv%252Cmvi%252Cpl%252Cinitcwndbps%26lsig%3DAGtxev0wRgIhAIrdBBCpbBkiZbBTZHnpE6fbdvo4m_leJiLrV9RNsG_zAiEA4y-A-_6yKecNR9pd-bqGEolPU0pITA92_3oYfr4h4WU%253D`;

const extractSignatureAndUrl = (
  input: string
): { signature: string | null; url: string | null } => {
  const regex = /s=([^&]+)&sp=sig&url=([^&]+)/;
  const match = input.match(regex);

  if (match) {
    return {
      signature: decodeURIComponent(match[1]),
      url: decodeURIComponent(match[2]),
    };
  }

  return {
    signature: null,
    url: null,
  };
};

const { signature, url } = extractSignatureAndUrl(signatureCipher);

if (signature && url) {
  console.log({ signature, url });
  console.log(`${url}&sig=`);
} else {
  console.log("No signature or url found");
}
