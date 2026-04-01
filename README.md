# VibeCoding
This is VibeCoding

### [바이브 코딩 협업 규칙]

# [협업 순서]
1. 작업 시작전 프로젝트와 연결된 VisualStudioCode에 들어가 git pull origin dev - 명령어 수행하여 프로젝트 업데이트 후 작업 시작
2. 작업 시작전 git branch - 명령어를 실행하여 본인의 브랜치인지 확인 이후 작업 시작
3. 작업이 끝나면 차례대로 git add . - 명령어 git commit -m '커밋 내용' - 명령어 실행
4. 마지막으로 git push origin 작업하고 있는 브랜치 이름 - 명령어 수행하여 깃허브로 업데이트
5. 깃허브로 들어가 merge 수행 이떄 dev 브랜치로 merge 수행(dev <- 개인브랜치(작업하고 있는 브랜치)) 


### [명령어]
명령어: git init
설명: git 환경 만들기

명령어: git remote add origin 깃주소
설명: 캡스톤 디자인 프로젝트 가져오기

명령어: git branch
설명: 현재 있는 깃 브랜치 종류 확인 및 현재 사용하고 있는 브랜치 확인

명령어: git branch 브랜치 이름
설명: 깃 브랜치 브랜치 이름으로 만들기

명령어: git switch 브랜치 이름
설명: 브랜치를 작성한 브랜치 이름으로 변경

명령어: git add .
설명: 수정 사항 저장

명령어: git commit -m '커밋 내용'
설명: 저장한 내용 push 전으로 올리기

명령어: git pull origin 브랜치 이름
설명: 깃허브 프로젝트 최신 내용 업데이트

명령어: git push origin 작업하고 있는 브랜치 이름
설명: commit한 내용 깃허브 프로젝트로 업데이트