# Third-party notices

## coss ui

The components in `apps/web/src/components/ui` and the segmented-control helper
in `apps/web/src/lib/segmented-control.ts` are adapted from the official
[coss ui registry](https://coss.com/ui). They use Base UI and Tailwind CSS.
Imports and slider accessibility labels have been adjusted for this project.

The upstream [licensing policy](https://github.com/cosscom/coss/blob/main/LICENSING.md)
and [UI README](https://github.com/cosscom/coss/blob/main/apps/ui/README.md)
license `apps/ui` under MIT. The copyright notice below follows the repository's
[MIT notice](https://github.com/cosscom/coss/blob/main/apps/origin/LICENSE.md).

MIT License

Copyright (c) 2025 coss.com
Originally Copyright (c) 2025 Origin UI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Signalsmith Stretch

The browser audio engine uses signalsmith-stretch 1.3.2 (WASM / AudioWorklet).
Upstream: https://github.com/Signalsmith-Audio/signalsmith-stretch

MIT License

Copyright (c) 2022 Geraint Luff / Signalsmith Audio Ltd.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Apple Music Like Lyrics (AMLL)

The lyric renderer and fluid cover background use @applemusic-like-lyrics/core
and @applemusic-like-lyrics/react 0.6.0, licensed AGPL-3.0-only.
Upstream: https://github.com/amll-dev/applemusic-like-lyrics

The unmodified license text is distributed at
`apps/web/public/licenses/AMLL-AGPL-3.0.txt`.
Integration source: `apps/web/src/components/netease/AmllLyrics.tsx`,
`AmllBackground.tsx` and `apps/web/src/lib/amll-lyrics.ts`.
Project source: https://github.com/retronew/utabiyori

This notice does not relicense unrelated project files. See `docs/amll.md` for
integration boundaries and publication requirements.
