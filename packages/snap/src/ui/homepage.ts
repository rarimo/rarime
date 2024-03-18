import type { OnHomePageHandler } from '@metamask/snaps-sdk';
import {
  row,
  image,
  copyable,
  divider,
  panel,
  text,
} from '@metamask/snaps-sdk';

import { StorageKeys } from '@/enums';
import { snapStorage } from '@/helpers';
import { VCManager } from '@/zkp/helpers';

export const onHomePage: OnHomePageHandler = async () => {
  const vcManager = await VCManager.create();
  const creds = await vcManager.getAllDecryptedVCs();

  const identityStorage = await snapStorage.getItem(StorageKeys.identity);

  return {
    content: panel([
      image(
        '<svg xmlns="http://www.w3.org/2000/svg" width="110" height="32" viewBox="0 0 110 32" fill="none"><rect width="110" height="32" rx="2" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M5 14.8623C4.99998 21.4661 9.66115 27.1517 16.1367 28.4468C17.1172 28.6429 18.1268 28.6429 19.1072 28.4466C25.5826 27.1515 30.2438 21.4659 30.2439 14.8623V10.3622C30.2439 6.48949 27.1043 3.35003 23.2316 3.35003H12.0122C8.13946 3.35003 5 6.48949 5 10.3622V14.8623ZM14.1976 14.5694C14.1976 14.1367 13.8468 13.7859 13.414 13.7859C12.9813 13.7859 12.6306 14.1367 12.6306 14.5694V18.7767C12.6306 19.2094 12.9813 19.5602 13.414 19.5602C13.8468 19.5602 14.1976 19.2094 14.1976 18.7767V14.5694ZM17.6217 13.6693C18.0544 13.6693 18.4052 14.0201 18.4052 14.4528V18.777C18.4052 19.2097 18.0544 19.5605 17.6217 19.5605C17.1889 19.5605 16.8381 19.2097 16.8381 18.777V14.4528C16.8381 14.0201 17.1889 13.6693 17.6217 13.6693ZM17.6206 9.57864L17.6177 9.57865C16.7024 9.58209 15.8061 9.83903 15.028 10.3209C14.6602 10.5488 14.5467 11.0317 14.7745 11.3996C15.0024 11.7676 15.4853 11.881 15.8531 11.6532C16.3847 11.324 16.9969 11.1484 17.6221 11.1457C19.5123 11.1465 21.0444 12.679 21.0444 14.5695V18.7768C21.0444 19.2095 21.3951 19.5603 21.8278 19.5603C22.2605 19.5603 22.6114 19.2095 22.6114 18.7768V14.5695C22.6114 11.8132 20.377 9.57864 17.6206 9.57864Z" fill="#202020"/><path d="M39.728 18.4658V11.2572C39.728 9.72806 40.1139 8.62129 40.8858 7.93683C41.6575 7.23781 42.8299 6.8883 44.4026 6.8883H46.1284V8.8543H45.0581C44.0532 8.8543 43.3396 9.10187 42.9172 9.597C42.4949 10.0921 42.2837 10.8713 42.2837 11.9343V18.4658H39.728Z" fill="#202020"/><path d="M47.2061 6.8883H53.7813C54.8443 6.8883 55.6526 7.2014 56.206 7.82761C56.7594 8.45381 57.0361 9.27662 57.0361 10.296V16.4998C57.0361 17.8105 56.3808 18.4658 55.0701 18.4658H49.2376C47.3154 18.4658 46.3541 17.2644 46.3541 14.8615C46.3541 13.7401 46.5944 12.8591 47.0751 12.2183C47.5556 11.5776 48.2765 11.2572 49.2376 11.2572H54.4803V10.5145C54.4803 9.40769 53.9414 8.8543 52.8638 8.8543H47.2061V6.8883ZM54.4803 13.2231H50.2206C49.4051 13.2231 48.9973 13.7693 48.9973 14.8615C48.9973 15.9537 49.4051 16.4998 50.2206 16.4998H53.8249C54.2619 16.4998 54.4803 16.2814 54.4803 15.8445V13.2231Z" fill="#202020"/><path d="M59.0551 18.4658V11.2572C59.0551 9.72806 59.441 8.62129 60.2129 7.93683C60.9848 7.23781 62.157 6.8883 63.7299 6.8883H65.4555V8.8543H64.3852C63.3803 8.8543 62.6667 9.10187 62.2445 9.597C61.8221 10.0921 61.611 10.8713 61.611 11.9343V18.4658H59.0551Z" fill="#202020"/><path d="M66.4575 18.4658V6.8883H69.0133V18.4658H66.4575ZM69.0133 5.35919H66.4575V3H69.0133V5.35919Z" fill="#202020"/><path d="M86.9472 6.60432L83.037 16.8056C82.7749 17.4609 82.4982 17.9343 82.2069 18.2255C81.9158 18.5022 81.4643 18.6406 80.8526 18.6406C80.241 18.6406 79.7895 18.5022 79.4983 18.2255C79.2071 17.9343 78.9304 17.4609 78.6682 16.8056L74.758 6.60432C74.6269 6.26937 74.5032 6.1019 74.3867 6.1019C74.2265 6.1019 74.1464 6.25481 74.1464 6.56063L74.2119 18.4658H71.3285V5.00968C71.3285 3.66989 72.1512 3 73.7969 3C74.5833 3 75.1658 3.16747 75.5444 3.50242C75.9231 3.83736 76.2362 4.32522 76.4838 4.96599L80.4376 15.1673C80.6123 15.5459 80.7507 15.7353 80.8526 15.7353C80.9545 15.7353 81.0929 15.5459 81.2676 15.1673L85.2215 4.96599C85.4691 4.32522 85.7822 3.83736 86.1608 3.50242C86.5395 3.16747 87.122 3 87.9083 3C89.554 3 90.3767 3.66989 90.3767 5.00968V18.4658H87.4933L87.5807 6.56063C87.5807 6.25481 87.4933 6.1019 87.3185 6.1019C87.2021 6.1019 87.0783 6.26937 86.9472 6.60432Z" fill="#202020"/><path d="M103.138 18.4658H96.7161C95.8131 18.4658 95.0631 18.342 94.4657 18.0945C93.8832 17.8469 93.4391 17.4609 93.1333 16.9367C92.8274 16.3979 92.6163 15.8008 92.4998 15.1455C92.3978 14.4902 92.3468 13.6601 92.3468 12.6553C92.3468 10.4125 92.7692 8.86886 93.6138 8.0242C94.473 7.17955 95.9145 6.75723 97.9389 6.75723C99.7449 6.75723 101.121 7.09217 102.068 7.76208C103.029 8.4174 103.51 9.61157 103.51 11.3445C103.51 12.8008 102.913 13.5289 101.719 13.5289H94.99C94.99 14.5339 95.1506 15.2838 95.4704 15.779C95.8058 16.2596 96.4756 16.4998 97.48 16.4998H103.138V18.4658ZM94.99 11.563H100.299C100.676 11.563 100.866 11.3372 100.866 10.8858C100.866 10.1722 100.582 9.63341 100.014 9.26933C99.4611 8.90526 98.7691 8.72322 97.9389 8.72322C96.8617 8.72322 96.0969 8.94895 95.6454 9.40041C95.2087 9.83729 94.99 10.5582 94.99 11.563Z" fill="#202020"/><path d="M42.8858 22.6632C43.2249 22.9876 43.3944 23.393 43.3944 23.8795C43.3944 24.366 43.2249 24.7739 42.8858 25.1031C42.5467 25.4275 42.1118 25.5897 41.5811 25.5897H40.7776V27.403H39.9151V22.1693H41.5811C42.1118 22.1693 42.5467 22.334 42.8858 22.6632ZM42.2813 24.5282C42.4583 24.3561 42.5467 24.14 42.5467 23.8795C42.5467 23.619 42.4583 23.4052 42.2813 23.2382C42.1094 23.0662 41.8735 22.9802 41.5737 22.9802H40.7776V24.7788H41.5737C41.8735 24.7788 42.1094 24.6952 42.2813 24.5282Z" fill="#202020" fill-opacity="0.56"/><path d="M47.0603 26.9239C46.6917 27.2924 46.2347 27.4767 45.6892 27.4767C45.1437 27.4767 44.6843 27.2924 44.3108 26.9239C43.9422 26.5504 43.7579 26.0958 43.7579 25.5602C43.7579 25.0245 43.9422 24.5724 44.3108 24.2038C44.6843 23.8304 45.1437 23.6436 45.6892 23.6436C46.2347 23.6436 46.6917 23.8304 47.0603 24.2038C47.4339 24.5724 47.6205 25.0245 47.6205 25.5602C47.6205 26.0958 47.4339 26.5504 47.0603 26.9239ZM45.6892 26.7249C46.0087 26.7249 46.2716 26.6143 46.478 26.3931C46.6893 26.1671 46.7949 25.8894 46.7949 25.5602C46.7949 25.2309 46.6893 24.9557 46.478 24.7346C46.2716 24.5085 46.0087 24.3955 45.6892 24.3955C45.3649 24.3955 45.0971 24.5085 44.8857 24.7346C44.6794 24.9557 44.5762 25.2309 44.5762 25.5602C44.5762 25.8894 44.6794 26.1671 44.8857 26.3931C45.0971 26.6143 45.3649 26.7249 45.6892 26.7249Z" fill="#202020" fill-opacity="0.56"/><path d="M51.5475 27.403L50.7366 25.0221L49.9331 27.403H49.1665L47.9281 23.7173H48.7832L49.5793 26.2605L50.427 23.7173H51.0462L51.8792 26.2605L52.69 23.7173H53.5525L52.3141 27.403H51.5475Z" fill="#202020" fill-opacity="0.56"/><path d="M55.7962 27.4767C55.2359 27.4767 54.7739 27.2973 54.4103 26.9386C54.0515 26.5799 53.8722 26.1204 53.8722 25.5602C53.8722 25.0147 54.054 24.5601 54.4177 24.1965C54.7813 23.8279 55.2408 23.6436 55.7962 23.6436C56.3072 23.6436 56.7298 23.8058 57.064 24.1301C57.4031 24.4545 57.5727 24.9016 57.5727 25.4717C57.5727 25.57 57.5702 25.6585 57.5653 25.7371H54.6683C54.688 26.0368 54.8034 26.2801 55.0148 26.4669C55.2261 26.6486 55.4889 26.7396 55.8035 26.7396C56.2753 26.7396 56.6266 26.5528 56.8576 26.1794L57.4768 26.6216C57.123 27.1917 56.5628 27.4767 55.7962 27.4767ZM54.7052 25.1474H56.7544C56.7102 24.8919 56.5947 24.6928 56.408 24.5503C56.2261 24.4029 56.0123 24.3291 55.7667 24.3291C55.5111 24.3291 55.2825 24.4004 55.0811 24.5429C54.8845 24.6855 54.7592 24.8869 54.7052 25.1474Z" fill="#202020" fill-opacity="0.56"/><path d="M58.4062 27.403V23.7173H59.217V24.3734C59.2859 24.167 59.4112 23.9999 59.593 23.8721C59.7797 23.7443 59.9788 23.6805 60.1901 23.6805C60.3179 23.6805 60.4235 23.6903 60.507 23.7099V24.5429C60.3891 24.4987 60.2539 24.4766 60.1016 24.4766C59.8559 24.4766 59.6471 24.5773 59.475 24.7788C59.303 24.9753 59.217 25.2506 59.217 25.6044V27.403H58.4062Z" fill="#202020" fill-opacity="0.56"/><path d="M62.7428 27.4767C62.1825 27.4767 61.7206 27.2973 61.3569 26.9386C60.9982 26.5799 60.8188 26.1204 60.8188 25.5602C60.8188 25.0147 61.0007 24.5601 61.3643 24.1965C61.728 23.8279 62.1875 23.6436 62.7428 23.6436C63.2539 23.6436 63.6765 23.8058 64.0106 24.1301C64.3497 24.4545 64.5193 24.9016 64.5193 25.4717C64.5193 25.57 64.5169 25.6585 64.5119 25.7371H61.6149C61.6347 26.0368 61.7501 26.2801 61.9614 26.4669C62.1728 26.6486 62.4357 26.7396 62.7501 26.7396C63.2219 26.7396 63.5733 26.5528 63.8042 26.1794L64.4234 26.6216C64.0696 27.1917 63.5094 27.4767 62.7428 27.4767ZM61.6518 25.1474H63.701C63.6568 24.8919 63.5414 24.6928 63.3546 24.5503C63.1728 24.4029 62.959 24.3291 62.7133 24.3291C62.4578 24.3291 62.2293 24.4004 62.0277 24.5429C61.8312 24.6855 61.7059 24.8869 61.6518 25.1474Z" fill="#202020" fill-opacity="0.56"/><path d="M66.864 27.4767C66.3628 27.4767 65.9401 27.29 65.5961 26.9165C65.2571 26.5431 65.0875 26.0909 65.0875 25.5602C65.0875 25.0294 65.2571 24.5773 65.5961 24.2038C65.9401 23.8304 66.3628 23.6436 66.864 23.6436C67.1146 23.6436 67.3456 23.7001 67.5569 23.8132C67.7682 23.9212 67.9304 24.0539 68.0434 24.2112V21.8745H68.8543V27.403H68.0434V26.9091C67.9304 27.0664 67.7682 27.2015 67.5569 27.3146C67.3456 27.4226 67.1146 27.4767 66.864 27.4767ZM66.2227 26.4005C66.4291 26.6265 66.692 26.7396 67.0114 26.7396C67.3308 26.7396 67.5938 26.6265 67.8002 26.4005C68.0066 26.1745 68.1098 25.8944 68.1098 25.5602C68.1098 25.226 68.0066 24.9459 67.8002 24.7198C67.5938 24.4938 67.3308 24.3807 67.0114 24.3807C66.692 24.3807 66.4291 24.4938 66.2227 24.7198C66.0163 24.9459 65.9131 25.226 65.9131 25.5602C65.9131 25.8944 66.0163 26.1745 66.2227 26.4005Z" fill="#202020" fill-opacity="0.56"/><path d="M73.6853 27.4767C73.4347 27.4767 73.2012 27.4226 72.985 27.3146C72.7737 27.2015 72.6115 27.0664 72.4985 26.9091V27.403H71.6877V21.8745H72.4985V24.2112C72.6115 24.0539 72.7737 23.9212 72.985 23.8132C73.2012 23.7001 73.4347 23.6436 73.6853 23.6436C74.1866 23.6436 74.6068 23.8304 74.9458 24.2038C75.2898 24.5773 75.4618 25.0294 75.4618 25.5602C75.4618 26.0909 75.2898 26.5431 74.9458 26.9165C74.6068 27.29 74.1866 27.4767 73.6853 27.4767ZM73.5379 26.7396C73.8573 26.7396 74.1202 26.6265 74.3266 26.4005C74.533 26.1745 74.6362 25.8944 74.6362 25.5602C74.6362 25.226 74.533 24.9459 74.3266 24.7198C74.1202 24.4938 73.8573 24.3807 73.5379 24.3807C73.2136 24.3807 72.9482 24.4938 72.7418 24.7198C72.5354 24.9459 72.4322 25.226 72.4322 25.5602C72.4322 25.8944 72.5354 26.1745 72.7418 26.4005C72.9482 26.6265 73.2136 26.7396 73.5379 26.7396Z" fill="#202020" fill-opacity="0.56"/><path d="M77.3806 28.9436H76.4887L77.2774 27.204L75.6926 23.7173H76.5845L77.7123 26.3268L78.8475 23.7173H79.7468L77.3806 28.9436Z" fill="#202020" fill-opacity="0.56"/><path d="M81.8809 27.403V23.7173H82.6918V24.3734C82.7605 24.167 82.8858 23.9999 83.0677 23.8721C83.2544 23.7443 83.4534 23.6805 83.6648 23.6805C83.7925 23.6805 83.8982 23.6903 83.9818 23.7099V24.5429C83.8638 24.4987 83.7287 24.4766 83.5764 24.4766C83.3306 24.4766 83.1217 24.5773 82.9498 24.7788C82.7778 24.9753 82.6918 25.2506 82.6918 25.6044V27.403H81.8809Z" fill="#202020" fill-opacity="0.56"/><path d="M86.0699 27.4767C85.5687 27.4767 85.146 27.29 84.802 26.9165C84.4629 26.5431 84.2934 26.0909 84.2934 25.5602C84.2934 25.0294 84.4629 24.5773 84.802 24.2038C85.146 23.8304 85.5687 23.6436 86.0699 23.6436C86.3205 23.6436 86.5515 23.7001 86.7628 23.8131C86.9741 23.9212 87.1363 24.0539 87.2493 24.2112V23.7173H88.0602V27.403H87.2493V26.9091C87.1363 27.0664 86.9741 27.2015 86.7628 27.3146C86.5515 27.4226 86.3205 27.4767 86.0699 27.4767ZM85.4286 26.4005C85.635 26.6265 85.8979 26.7396 86.2173 26.7396C86.5368 26.7396 86.7997 26.6265 87.0061 26.4005C87.2125 26.1745 87.3157 25.8944 87.3157 25.5602C87.3157 25.226 87.2125 24.9459 87.0061 24.7198C86.7997 24.4938 86.5368 24.3807 86.2173 24.3807C85.8979 24.3807 85.635 24.4938 85.4286 24.7198C85.2222 24.9459 85.119 25.226 85.119 25.5602C85.119 25.8944 85.2222 26.1745 85.4286 26.4005Z" fill="#202020" fill-opacity="0.56"/><path d="M89.1587 27.403V23.7173H89.9696V24.3734C90.0384 24.167 90.1637 23.9999 90.3455 23.8721C90.5323 23.7443 90.7313 23.6805 90.9426 23.6805C91.0704 23.6805 91.176 23.6903 91.2596 23.7099V24.5429C91.1416 24.4987 91.0064 24.4766 90.8541 24.4766C90.6084 24.4766 90.3996 24.5773 90.2276 24.7788C90.0555 24.9753 89.9696 25.2506 89.9696 25.6044V27.403H89.1587Z" fill="#202020" fill-opacity="0.56"/><path d="M92.3644 22.9138C92.217 22.9138 92.0892 22.8622 91.9811 22.759C91.873 22.651 91.819 22.5207 91.819 22.3684C91.819 22.2209 91.873 22.0956 91.9811 21.9924C92.0892 21.8843 92.217 21.8302 92.3644 21.8302C92.5168 21.8302 92.6446 21.8843 92.7478 21.9924C92.851 22.0956 92.9026 22.2209 92.9026 22.3684C92.9026 22.5207 92.851 22.651 92.7478 22.759C92.6446 22.8622 92.5168 22.9138 92.3644 22.9138ZM91.959 27.403V23.7173H92.7699V27.403H91.959Z" fill="#202020" fill-opacity="0.56"/><path d="M98.5553 27.403V25.3317C98.5553 25.0319 98.4982 24.7984 98.3858 24.6314C98.277 24.4643 98.1149 24.3807 97.8992 24.3807C97.6385 24.3807 97.4293 24.4815 97.2727 24.683C97.1151 24.8845 97.0313 25.167 97.0221 25.5307V27.403H96.2112V25.3317C96.2112 25.0319 96.1541 24.7984 96.0417 24.6314C95.9329 24.4643 95.7708 24.3807 95.5551 24.3807C95.2842 24.3807 95.0686 24.4864 94.9062 24.6977C94.7489 24.909 94.6703 25.2063 94.6703 25.5897V27.403H93.8594V23.7173H94.6703V24.2186C94.8963 23.8353 95.2455 23.6436 95.7173 23.6436C96.272 23.6436 96.6535 23.8869 96.8599 24.3734C96.9631 24.1424 97.1197 23.9631 97.3316 23.8353C97.5473 23.7075 97.7831 23.6436 98.0393 23.6436C98.4521 23.6436 98.7764 23.7837 99.0123 24.0638C99.2482 24.3439 99.3662 24.7223 99.3662 25.199V27.403H98.5553Z" fill="#202020" fill-opacity="0.56"/><path d="M103.44 26.9239C103.071 27.2924 102.614 27.4767 102.069 27.4767C101.523 27.4767 101.064 27.2924 100.69 26.9239C100.322 26.5504 100.137 26.0958 100.137 25.5602C100.137 25.0245 100.322 24.5724 100.69 24.2038C101.064 23.8304 101.523 23.6436 102.069 23.6436C102.614 23.6436 103.071 23.8304 103.44 24.2038C103.814 24.5724 104 25.0245 104 25.5602C104 26.0958 103.814 26.5504 103.44 26.9239ZM102.069 26.7249C102.388 26.7249 102.651 26.6143 102.857 26.3931C103.069 26.1671 103.174 25.8894 103.174 25.5602C103.174 25.2309 103.069 24.9557 102.857 24.7346C102.651 24.5085 102.388 24.3955 102.069 24.3955C101.744 24.3955 101.477 24.5085 101.265 24.7346C101.059 24.9557 100.956 25.2309 100.956 25.5602C100.956 25.8894 101.059 26.1671 101.265 26.3931C101.477 26.6143 101.744 26.7249 102.069 26.7249Z" fill="#202020" fill-opacity="0.56"/></svg>',
      ),
      text('RariMe lives right in your MetaMask.'),
      text(
        'It’s where you securely store and manage your credentials, attestations, licenses, event tickets, and more — all in one place',
      ),

      divider(),

      text('Your DID:'),
      copyable({
        value: identityStorage.did || 'Not created yet',
      }),
      row('Total credentials', text(`${creds.length || 0}`)),

      text(
        'Manage your wallet & Credentials with [Rarime App](https://app.rarime.com)',
      ),
    ]),
  };
};
