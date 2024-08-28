import { CdnType } from './consts';
import { Unpkg } from './cdn-impl/unpkg';
import { Jsdelivr } from './cdn-impl/jsdelivr';
import { CDN } from './cdn-impl/cdn-base';


export const cdnFactory = (cdn: CdnType): CDN => {
  switch (cdn) {
    case CdnType.UNPKG:
      return new Unpkg();
    case CdnType.JSDELIVR:
      return new Jsdelivr();
    default:
      throw new Error(`Unknown CDN ${cdn}`);
  }
}
